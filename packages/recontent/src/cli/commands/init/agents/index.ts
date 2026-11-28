import fs from "node:fs";
import path from "node:path";
import { writeInstructionsFile, type InstructionFile } from "./instructions.js";
import { writeMcpConfig, type McpClient } from "./mcp.js";
import { writeProjectSkill, type SkillTarget } from "./skill.js";

export type AgentMode = "cli" | "mcp";
export type { InstructionFile, McpClient, SkillTarget };

export type AgentSetupOptions = {
  cwd: string;
  mode: AgentMode;
  from?: string;
  designMdPath?: string;
  skills?: SkillTarget[];
  mcp?: McpClient[];
  instructions?: InstructionFile[];
};

export type AgentFileResult = {
  path: string;
  status: "created" | "updated" | "unchanged";
};

const DESIGN_MD_CANDIDATES = ["DESIGN.md", "docs/DESIGN.md"] as const;

export function detectDesignMd(cwd: string): string | undefined {
  return DESIGN_MD_CANDIDATES.find((candidate) => fs.existsSync(path.join(cwd, candidate)));
}

export async function runAgentSetup(options: AgentSetupOptions): Promise<AgentFileResult[]> {
  const results: AgentFileResult[] = [];
  const renderOptions = {
    mode: options.mode,
    from: options.from,
    designMdPath: options.designMdPath,
  };

  for (const target of options.skills ?? []) {
    results.push(await writeProjectSkill(options.cwd, renderOptions, target));
  }

  for (const client of options.mcp ?? []) {
    results.push(await writeMcpConfig(options.cwd, client, { from: options.from }));
  }

  for (const filename of options.instructions ?? []) {
    results.push(await writeInstructionsFile(options.cwd, filename, renderOptions));
  }

  return results;
}
