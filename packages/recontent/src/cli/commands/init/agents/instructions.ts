import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import {
  formatShellArg,
  type AgentFileResult,
  type AgentMode,
  type PlannedAgentWrite,
} from "./index.js";

export type InstructionFile = "AGENTS.md" | "CLAUDE.md";

const START_MARKER = "<!-- recontent:start -->";
const END_MARKER = "<!-- recontent:end -->";

export function renderInstructionsBlock(options: {
  mode: AgentMode;
  from?: string;
  config?: string;
  designMdPath?: string;
}): string {
  const { mode, from, config, designMdPath } = options;
  const isConsumer = from !== undefined;
  const targetSuffix = isConsumer
    ? ` --from ${formatShellArg(from)}`
    : config !== undefined
      ? ` -c ${formatShellArg(config)}`
      : "";
  const buildCmd =
    config !== undefined ? `recontent build -c ${formatShellArg(config)}` : "recontent build";
  const intro =
    mode === "cli"
      ? "Use Recontent as the source of truth for this project's design system. Do not guess component props, token names, or raw CSS values."
      : "Use the `recontent` MCP server as the source of truth for this project's design system. Do not guess component props, token names, or raw CSS values.";

  const lines: string[] = [
    START_MARKER,
    "## Design system",
    "",
    designMdPath ? `${intro} Read \`${designMdPath}\` first.` : intro,
    "",
  ];

  if (mode === "cli") {
    lines.push(
      "```bash",
      `recontent inspect${targetSuffix}                    # overview: themes, token layers, component names`,
      `recontent inspect components <Name>${targetSuffix}  # exact import, props, defaults, and usage notes`,
      `recontent inspect tokens <group>${targetSuffix}     # token values, CSS variables, and theme overrides`,
      `recontent inspect types <Name>${targetSuffix}       # project TypeScript types referenced by props`,
      `recontent inspect search <query>${targetSuffix}     # search by keyword, CSS variable, or raw value`,
      "```",
    );
  } else {
    lines.push(
      "- `get_design_system_overview` — themes, token layers, component and type names",
      "- `list_components` / `get_components` — browse components and inspect exact imports, props, and usage notes",
      "- `get_tokens` — token groups, values, CSS variables, and theme overrides",
      "- `get_component_types` — project TypeScript types referenced by props",
      "- `search_design_system` — search by keyword, CSS variable, or raw value",
    );
  }

  if (!isConsumer) {
    lines.push("", `Do not edit generated files directly; run \`${buildCmd}\` instead.`);
  }

  lines.push(END_MARKER);
  return lines.join("\n");
}

export function upsertManagedBlock(existing: string | undefined, block: string): string {
  if (existing === undefined || existing.trim().length === 0) {
    return `${block}\n`;
  }

  const startIndex = existing.indexOf(START_MARKER);
  const endIndex = existing.indexOf(END_MARKER);

  if (startIndex === -1 && endIndex === -1) {
    return `${existing.trimEnd()}\n\n${block}\n`;
  }

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(
      `Malformed Recontent markers (${START_MARKER} / ${END_MARKER}). Fix or remove the markers before re-running \`recontent init\`.`,
    );
  }

  const secondStart = existing.indexOf(START_MARKER, startIndex + START_MARKER.length);
  const secondEnd = existing.indexOf(END_MARKER, endIndex + END_MARKER.length);
  if (secondStart !== -1 || secondEnd !== -1) {
    throw new Error(
      `Duplicate Recontent markers (${START_MARKER} / ${END_MARKER}). Fix or remove the duplicate markers before re-running \`recontent init\`.`,
    );
  }

  const before = existing.slice(0, startIndex);
  const after = existing.slice(endIndex + END_MARKER.length);
  const combined = `${before}${block}${after}`;
  return combined.endsWith("\n") ? combined : `${combined}\n`;
}

export async function prepareInstructionsFile(
  cwd: string,
  filename: InstructionFile,
  options: { mode: AgentMode; from?: string; config?: string; designMdPath?: string },
): Promise<PlannedAgentWrite> {
  const target = path.join(cwd, filename);
  let existing: string | undefined;
  try {
    existing = await readFile(target, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const block = renderInstructionsBlock(options);
  let content: string;
  try {
    content = upsertManagedBlock(existing, block);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${filename}: ${detail}`, { cause: error });
  }

  return { filePath: filename, content, existed: existing !== undefined };
}

export async function writeInstructionsFile(
  cwd: string,
  filename: InstructionFile,
  options: { mode: AgentMode; from?: string; config?: string; designMdPath?: string },
): Promise<AgentFileResult> {
  const planned = await prepareInstructionsFile(cwd, filename, options);
  const { path: writtenPath, skipReason } = await writeOutputFile(
    planned.filePath,
    planned.content,
    cwd,
  );
  return {
    path: writtenPath,
    status: skipReason === "unchanged" ? "unchanged" : planned.existed ? "updated" : "created",
  };
}
