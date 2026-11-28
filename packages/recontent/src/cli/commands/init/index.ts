import fs from "node:fs";
import path from "node:path";
import { createLogger, type LogLevel } from "../../../logger.js";
import { exitWithError } from "../../utils/exit.js";
import { plural } from "../../utils/format.js";
import { displayPath, writeOutputFile } from "../../utils/fs.js";
import {
  detectDesignMd,
  formatShellArg,
  planAgentSetup,
  writeAgentPlan,
  type AgentMode,
  type InstructionFile,
  type McpClient,
  type PlannedAgentWrite,
  type SkillTarget,
} from "./agents/index.js";
import { generateConfigFromDtcg } from "./dtcg-import/index.js";
import type { DtcgImportStats } from "./dtcg-import/index.js";
import { getPreset } from "./presets/index.js";

export type InitOptions = {
  cwd: string;
  configPath: string;
  /** Explicit `-c/--config` argument (relative to `cwd`) to embed in generated agent files. */
  configArg?: string;
  logLevel?: LogLevel;
  force?: boolean;
  /** A preset name, or DTCG sources (resolver, token files or directories) to generate the config from. */
  source?: { preset: string } | { dtcg: string[] };
  /** Published design system package or snapshot path for consumer agent setup. */
  from?: string;
  agents?: {
    mode: AgentMode;
    skills?: SkillTarget[];
    mcp?: McpClient[];
    instructions?: InstructionFile[];
    designMdPath?: string;
  };
};

function describeImport({ tokens, ref, system, themes, skipped }: DtcgImportStats): string {
  const imported = `Imported ${plural(tokens, "token")} (${ref} ref, ${system} system) and ${plural(themes, "theme")}`;
  return skipped > 0 ? `${imported}; skipped ${plural(skipped, "entry", "entries")}` : imported;
}

export async function runInit(options: InitOptions): Promise<void> {
  const { configPath, configArg, cwd, source, from, agents } = options;
  const shownPath = displayPath(cwd, configPath);
  const logger = createLogger(options.logLevel);

  // Validate and prepare all outputs before touching disk so a validation error
  // (e.g. invalid .mcp.json or malformed AGENTS.md markers) leaves no partial writes.
  let preparedConfig:
    | {
        text: string;
        imported?: ReturnType<typeof generateConfigFromDtcg>;
        preset?: ReturnType<typeof getPreset>;
      }
    | undefined;

  if (source) {
    if (!options.force && fs.existsSync(configPath)) {
      exitWithError(`${shownPath} already exists. Use --force to overwrite.`);
      return;
    }

    if ("dtcg" in source) {
      const imported = generateConfigFromDtcg({ sources: source.dtcg, cwd });
      preparedConfig = { text: imported.source, imported };
    } else {
      const preset = getPreset(source.preset);
      preparedConfig = { text: preset.source, preset };
    }
  }

  const hasAgentTargets = Boolean(
    agents &&
    ((agents.skills && agents.skills.length > 0) ||
      (agents.mcp && agents.mcp.length > 0) ||
      agents.instructions?.length),
  );

  let agentPlan: PlannedAgentWrite[] = [];
  if (agents && hasAgentTargets) {
    const designMdPath = agents.designMdPath ?? detectDesignMd(cwd);
    agentPlan = await planAgentSetup({
      cwd,
      mode: agents.mode,
      from,
      config: from === undefined ? configArg : undefined,
      designMdPath,
      skills: agents.skills,
      mcp: agents.mcp,
      instructions: agents.instructions,
    });
  }

  let wroteConfig = false;

  if (preparedConfig) {
    // `writeMode: "once"` checks existsSync() before writing — not perfectly
    // atomic, but avoids inverting control flow through a catch block. `-c` is the
    // user's own choice of destination, so it is not confined to `cwd`.
    const { skipReason } = await writeOutputFile(
      path.basename(configPath),
      preparedConfig.text,
      path.dirname(configPath),
      { writeMode: options.force ? "always" : "once" },
    );

    if (skipReason === "exists") {
      exitWithError(`${shownPath} already exists. Use --force to overwrite.`);
      return;
    }

    wroteConfig = true;

    if (skipReason === "unchanged") {
      logger.info(`${shownPath} is already up to date`);
    } else {
      logger.info(
        preparedConfig.preset
          ? `Created ${shownPath} from the "${preparedConfig.preset.name}" preset`
          : `Created ${shownPath}`,
      );
    }
    if (preparedConfig.imported) {
      logger.info(describeImport(preparedConfig.imported.stats));
      for (const warning of preparedConfig.imported.warnings) logger.warn(warning);
    }
  }

  if (agentPlan.length > 0) {
    const results = await writeAgentPlan(cwd, agentPlan);
    for (const result of results) {
      const shown = displayPath(cwd, result.path);
      if (result.status === "created") {
        logger.info(`Created ${shown}`);
      } else if (result.status === "updated") {
        logger.info(`Updated ${shown}`);
      } else {
        logger.info(`${shown} is already up to date`);
      }
    }
  }

  const configSuffix = configArg !== undefined ? ` -c ${formatShellArg(configArg)}` : "";
  const configuredMcp = Boolean(agents?.mode === "mcp" && agents.mcp && agents.mcp.length > 0);

  if (wroteConfig && configuredMcp) {
    logger.info(
      `Next: add plugins from "recontent/plugins" to ${shownPath}, run \`recontent build${configSuffix}\`, and reload your MCP client so it picks up the "recontent" server.`,
    );
  } else if (wroteConfig) {
    logger.info(
      `Next: add plugins from "recontent/plugins" to ${shownPath}, then run \`recontent build${configSuffix}\`.`,
    );
  } else if (configuredMcp) {
    logger.info('Next: reload your MCP client so it picks up the "recontent" server.');
  } else if (from && hasAgentTargets) {
    logger.info(
      `Next: run \`recontent inspect --from ${formatShellArg(from)}\` to explore the snapshot.`,
    );
  } else if (hasAgentTargets) {
    logger.info(`Next: run \`recontent inspect${configSuffix}\` to explore your design system.`);
  }
}
