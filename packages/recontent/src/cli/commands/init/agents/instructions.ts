import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import type { AgentFileResult, AgentMode } from "./index.js";

export type InstructionFile = "AGENTS.md" | "CLAUDE.md";

const START_MARKER = "<!-- recontent:start -->";
const END_MARKER = "<!-- recontent:end -->";

function formatShellArg(value: string): string {
  return /\s|["'$`\\]/.test(value) ? JSON.stringify(value) : value;
}

export function renderInstructionsBlock(options: {
  mode: AgentMode;
  from?: string;
  designMdPath?: string;
}): string {
  const { mode, from, designMdPath } = options;
  const isConsumer = from !== undefined;
  const fromSuffix = isConsumer ? ` --from ${formatShellArg(from)}` : "";
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
      `recontent inspect${fromSuffix}                    # overview: themes, token layers, component names`,
      `recontent inspect components <Name>${fromSuffix}  # exact import, props, defaults, and usage notes`,
      `recontent inspect tokens <group>${fromSuffix}     # token values, CSS variables, and theme overrides`,
      `recontent inspect types <Name>${fromSuffix}       # project TypeScript types referenced by props`,
      `recontent inspect search <query>${fromSuffix}     # search by keyword, CSS variable, or raw value`,
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
    lines.push("", "Do not edit generated files directly; run `recontent build` instead.");
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

export async function writeInstructionsFile(
  cwd: string,
  filename: InstructionFile,
  options: { mode: AgentMode; from?: string; designMdPath?: string },
): Promise<AgentFileResult> {
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

  const { path: writtenPath, skipReason } = await writeOutputFile(filename, content, cwd);
  return {
    path: writtenPath,
    status:
      skipReason === "unchanged" ? "unchanged" : existing !== undefined ? "updated" : "created",
  };
}
