import fs from "node:fs";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import { prepareInstructionsFile, type InstructionFile } from "./instructions.js";
import { prepareMcpConfig, type McpClient } from "./mcp.js";
import { prepareProjectSkill, type SkillTarget } from "./skill.js";

export type AgentMode = "cli" | "mcp";
export type { InstructionFile, McpClient, SkillTarget };

export type AgentSetupOptions = {
  cwd: string;
  mode: AgentMode;
  from?: string;
  config?: string;
  designMdPath?: string;
  skills?: SkillTarget[];
  mcp?: McpClient[];
  instructions?: InstructionFile[];
};

export type AgentFileResult = {
  path: string;
  status: "created" | "updated" | "unchanged";
};

export type PlannedAgentWrite = {
  filePath: string;
  content: string;
  existed: boolean;
};

const DESIGN_MD_CANDIDATES = ["DESIGN.md", "docs/DESIGN.md"] as const;
const SAFE_SHELL_ARG = /^[A-Za-z0-9_@%+=:,./-]+$/;

export function formatShellArg(value: string): string {
  if (value.length === 0) return "''";
  if (SAFE_SHELL_ARG.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

export function detectDesignMd(cwd: string): string | undefined {
  return DESIGN_MD_CANDIDATES.find((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

/** Validates existing files and prepares all agent writes without touching disk. */
export async function planAgentSetup(options: AgentSetupOptions): Promise<PlannedAgentWrite[]> {
  const planned: PlannedAgentWrite[] = [];
  const renderOptions = {
    mode: options.mode,
    from: options.from,
    config: options.config,
    designMdPath: options.designMdPath,
  };

  for (const target of options.skills ?? []) {
    planned.push(prepareProjectSkill(options.cwd, renderOptions, target));
  }

  for (const client of options.mcp ?? []) {
    planned.push(
      await prepareMcpConfig(options.cwd, client, {
        from: options.from,
        config: options.config,
      }),
    );
  }

  for (const filename of options.instructions ?? []) {
    planned.push(await prepareInstructionsFile(options.cwd, filename, renderOptions));
  }

  return planned;
}

export async function writeAgentPlan(
  cwd: string,
  plan: readonly PlannedAgentWrite[],
): Promise<AgentFileResult[]> {
  const results: AgentFileResult[] = [];
  for (const item of plan) {
    const { path: writtenPath, skipReason } = await writeOutputFile(
      item.filePath,
      item.content,
      cwd,
    );
    results.push({
      path: writtenPath,
      status: skipReason === "unchanged" ? "unchanged" : item.existed ? "updated" : "created",
    });
  }
  return results;
}
