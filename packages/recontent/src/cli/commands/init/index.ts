import fs from "node:fs";
import path from "node:path";
import { createLogger, type LogLevel } from "../../../logger.js";
import { isSnapshotFilePath, readSnapshot } from "../../../snapshot/snapshot.js";
import { exitWithError } from "../../utils/exit.js";
import { plural } from "../../utils/format.js";
import { displayPath, writeOutputFile } from "../../utils/fs.js";
import {
  detectDesignMd,
  runAgentSetup,
  type AgentMode,
  type InstructionFile,
  type McpClient,
  type SkillTarget,
} from "./agents/index.js";
import { generateConfigFromDtcg } from "./dtcg-import/index.js";
import type { DtcgImportStats } from "./dtcg-import/index.js";
import { getPreset } from "./presets/index.js";

export type InitOptions = {
  cwd: string;
  configPath: string;
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
  const { configPath, cwd, source, from, agents } = options;
  const shownPath = displayPath(cwd, configPath);
  const logger = createLogger(options.logLevel);

  if (from !== undefined && isSnapshotFilePath(from)) {
    readSnapshot(from, cwd);
  }

  let wroteConfig = false;

  if (source) {
    if (!options.force && fs.existsSync(configPath)) {
      exitWithError(`${shownPath} already exists. Use --force to overwrite.`);
      return;
    }

    let text: string;
    let imported: ReturnType<typeof generateConfigFromDtcg> | undefined;
    let preset: ReturnType<typeof getPreset> | undefined;
    if ("dtcg" in source) {
      imported = generateConfigFromDtcg({ sources: source.dtcg, cwd });
      text = imported.source;
    } else {
      preset = getPreset(source.preset);
      text = preset.source;
    }

    // `writeMode: "once"` checks existsSync() before writing — not perfectly
    // atomic, but avoids inverting control flow through a catch block. `-c` is the
    // user's own choice of destination, so it is not confined to `cwd`.
    const { skipReason } = await writeOutputFile(
      path.basename(configPath),
      text,
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
        preset ? `Created ${shownPath} from the "${preset.name}" preset` : `Created ${shownPath}`,
      );
    }
    if (imported) {
      logger.info(describeImport(imported.stats));
      for (const warning of imported.warnings) logger.warn(warning);
    }
  }

  const hasAgentTargets = Boolean(
    agents &&
    ((agents.skills && agents.skills.length > 0) ||
      (agents.mcp && agents.mcp.length > 0) ||
      agents.instructions?.length),
  );

  if (agents && hasAgentTargets) {
    const designMdPath = agents.designMdPath ?? detectDesignMd(cwd);
    const results = await runAgentSetup({
      cwd,
      mode: agents.mode,
      from,
      designMdPath,
      skills: agents.skills,
      mcp: agents.mcp,
      instructions: agents.instructions,
    });

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

  if (wroteConfig) {
    logger.info(
      `Next: add plugins from "recontent/plugins" to ${shownPath}, then run \`recontent build\`.`,
    );
  } else if (agents?.mode === "mcp" && agents.mcp && agents.mcp.length > 0) {
    logger.info('Next: reload your MCP client so it picks up the "recontent" server.');
  } else if (from) {
    logger.info(`Next: run \`recontent inspect --from ${from}\` to explore the snapshot.`);
  } else if (hasAgentTargets) {
    logger.info("Next: run `recontent inspect` to explore your design system.");
  }
}
