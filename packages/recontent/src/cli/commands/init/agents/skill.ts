import fs from "node:fs";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import type { AgentFileResult, AgentMode } from "./index.js";

export type SkillTarget = "agents" | "claude";

type SkillTargetSpec = {
  id: SkillTarget;
  label: string;
  path: string;
};

export const SKILL_TARGETS: Record<SkillTarget, SkillTargetSpec> = {
  agents: {
    id: "agents",
    label: "Agent Skill (.agents)",
    path: ".agents/skills/recontent/SKILL.md",
  },
  claude: {
    id: "claude",
    label: "Agent Skill (.claude)",
    path: ".claude/skills/recontent/SKILL.md",
  },
};

export const SKILL_TARGET_NAMES: readonly SkillTarget[] = ["agents", "claude"];

export function parseSkillTargets(value: boolean | string): SkillTarget[] {
  if (value === true) return ["agents"];
  if (value === false) return [];

  const result: SkillTarget[] = [];
  const seen = new Set<SkillTarget>();

  const rawItems = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  if (rawItems.length === 0) {
    throw new Error(
      `Invalid --skill value. Expected one or more of: ${SKILL_TARGET_NAMES.join(", ")}, all.`,
    );
  }

  for (const item of rawItems) {
    if (item === "all") {
      for (const target of SKILL_TARGET_NAMES) {
        if (!seen.has(target)) {
          seen.add(target);
          result.push(target);
        }
      }
      continue;
    }

    if (!Object.hasOwn(SKILL_TARGETS, item)) {
      throw new Error(
        `Unknown skill target "${item}". Available targets: ${SKILL_TARGET_NAMES.join(", ")}, all.`,
      );
    }

    const target = item as SkillTarget;
    if (!seen.has(target)) {
      seen.add(target);
      result.push(target);
    }
  }

  return result;
}

function formatShellArg(value: string): string {
  return /\s|["'$`\\]/.test(value) ? JSON.stringify(value) : value;
}

export function renderProjectSkill(options: {
  mode: AgentMode;
  from?: string;
  designMdPath?: string;
}): string {
  const { mode, from, designMdPath } = options;
  const isConsumer = from !== undefined;
  const fromSuffix = isConsumer ? ` --from ${formatShellArg(from)}` : "";

  const lines: string[] = [
    "---",
    "name: recontent",
    "description: Query the project's design system for exact tokens, component props, types, and usage notes via Recontent. Use whenever writing or modifying UI, styling elements, or choosing components.",
    "---",
    "",
    "# Recontent Design System",
    "",
    "Use Recontent as the source of truth for this project's design system. Do not guess component props, token names, or raw CSS values.",
    "",
  ];

  if (designMdPath) {
    lines.push(
      `Read \`${designMdPath}\` first for design principles, token conventions, and the component index.`,
      "",
    );
  }

  if (mode === "cli") {
    lines.push(
      "## Workflow",
      "",
      "Query only what you need using `recontent inspect`:",
      "",
      "```bash",
      `recontent inspect${fromSuffix}                          # overview: themes, token layers, component names`,
      `recontent inspect components <Name>${fromSuffix}        # exact import, props, defaults, and usage notes`,
      `recontent inspect tokens <group>${fromSuffix}           # token values, CSS variables, and theme overrides`,
      `recontent inspect types <Name>${fromSuffix}             # project TypeScript types referenced by props`,
      `recontent inspect search <query>${fromSuffix}           # search by keyword, CSS variable, or raw value`,
      "```",
      "",
      "## Rules",
      "",
      `- Before using a component, run \`recontent inspect components <Name>${fromSuffix}\` and follow its usage notes.`,
      `- Use design tokens from \`recontent inspect tokens${fromSuffix}\` instead of raw colors, sizes, or font stacks.`,
      `- Search before hardcoding a value: \`recontent inspect search "<value>"${fromSuffix}\` finds existing tokens or components.`,
    );

    if (!isConsumer) {
      lines.push("- Do not edit generated files directly; run `recontent build` instead.");
    }

    lines.push(
      "",
      "## Error recovery",
      "",
      '- **Exit code 2** (unknown name or path): stderr includes `"Did you mean"` suggestions — retry with the suggested name.',
      "- **Exit code 1** (broken config, snapshot, or introspection): report the error to the user; do not retry blindly.",
    );
  } else {
    lines.push(
      "## Workflow",
      "",
      "Query only what you need using the `recontent` MCP server tools:",
      "",
      "1. `get_design_system_overview` — orient yourself with themes, token layers, component names, and type names.",
      "2. `list_components` — browse components by category or status.",
      "3. `get_components` — inspect exact imports, props, defaults, usage notes, and examples before using a component.",
      "4. `get_tokens` — list token groups or inspect resolved values, CSS variables, and theme overrides.",
      "5. `get_component_types` — inspect project TypeScript types referenced by component props.",
      "6. `search_design_system` — search by keyword, CSS variable, or raw value before hardcoding anything.",
      "",
      "## Rules",
      "",
      "- Always call `get_components` before using a component to verify its exact import, props, and usage notes.",
      "- Use design tokens from `get_tokens` instead of raw colors, sizes, or font stacks.",
      "- Call `search_design_system` before hardcoding a color, spacing, or size value.",
    );

    if (!isConsumer) {
      lines.push("- Do not edit generated files directly; run `recontent build` instead.");
    }

    lines.push(
      "",
      "## Error recovery",
      "",
      '- If a tool returns an error with `"Did you mean"` suggestions, retry with the suggested name.',
      "- If a tool reports a broken config or snapshot error, report it to the user instead of guessing.",
    );
  }

  return `${lines.join("\n")}\n`;
}

export async function writeProjectSkill(
  cwd: string,
  options: { mode: AgentMode; from?: string; designMdPath?: string },
  target: SkillTarget = "agents",
): Promise<AgentFileResult> {
  const skillPath = SKILL_TARGETS[target].path;
  const fullPath = path.join(cwd, skillPath);
  const existed = fs.existsSync(fullPath);
  const content = renderProjectSkill(options);
  const { path: writtenPath, skipReason } = await writeOutputFile(skillPath, content, cwd);
  return {
    path: writtenPath,
    status: skipReason === "unchanged" ? "unchanged" : existed ? "updated" : "created",
  };
}
