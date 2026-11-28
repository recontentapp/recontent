import fs from "node:fs";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import {
  formatShellArg,
  type AgentFileResult,
  type AgentMode,
  type PlannedAgentWrite,
} from "./index.js";

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

export function parseSkillTargets(
  value: boolean | string | ReadonlyArray<boolean | string>,
): SkillTarget[] {
  const entries: ReadonlyArray<boolean | string> = Array.isArray(value) ? value : [value];
  const result: SkillTarget[] = [];
  const seen = new Set<SkillTarget>();

  const addTarget = (target: SkillTarget) => {
    if (!seen.has(target)) {
      seen.add(target);
      result.push(target);
    }
  };

  for (const entry of entries) {
    if (entry === true) {
      addTarget("agents");
      continue;
    }
    if (entry === false) continue;

    const rawItems = entry
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
        for (const target of SKILL_TARGET_NAMES) addTarget(target);
        continue;
      }

      if (!Object.hasOwn(SKILL_TARGETS, item)) {
        throw new Error(
          `Unknown skill target "${item}". Available targets: ${SKILL_TARGET_NAMES.join(", ")}, all.`,
        );
      }

      addTarget(item as SkillTarget);
    }
  }

  return result;
}

export function renderProjectSkill(options: {
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
      `recontent inspect${targetSuffix}                          # overview: themes, token layers, component names`,
      `recontent inspect components <Name>${targetSuffix}        # exact import, props, defaults, and usage notes`,
      `recontent inspect tokens <group>${targetSuffix}           # token values, CSS variables, and theme overrides`,
      `recontent inspect types <Name>${targetSuffix}             # project TypeScript types referenced by props`,
      `recontent inspect search <query>${targetSuffix}           # search by keyword, CSS variable, or raw value`,
      "```",
      "",
      "## Rules",
      "",
      `- Before using a component, run \`recontent inspect components <Name>${targetSuffix}\` and follow its usage notes.`,
      `- Use design tokens from \`recontent inspect tokens${targetSuffix}\` instead of raw colors, sizes, or font stacks.`,
      `- Search before hardcoding a value: \`recontent inspect search "<value>"${targetSuffix}\` finds existing tokens or components.`,
    );

    if (!isConsumer) {
      lines.push(`- Do not edit generated files directly; run \`${buildCmd}\` instead.`);
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
      lines.push(`- Do not edit generated files directly; run \`${buildCmd}\` instead.`);
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

export function prepareProjectSkill(
  cwd: string,
  options: { mode: AgentMode; from?: string; config?: string; designMdPath?: string },
  target: SkillTarget = "agents",
): PlannedAgentWrite {
  const skillPath = SKILL_TARGETS[target].path;
  return {
    filePath: skillPath,
    content: renderProjectSkill(options),
    existed: fs.existsSync(path.join(cwd, skillPath)),
  };
}

export async function writeProjectSkill(
  cwd: string,
  options: { mode: AgentMode; from?: string; config?: string; designMdPath?: string },
  target: SkillTarget = "agents",
): Promise<AgentFileResult> {
  const planned = prepareProjectSkill(cwd, options, target);
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
