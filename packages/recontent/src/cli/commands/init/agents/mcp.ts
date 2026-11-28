import fs from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeOutputFile } from "../../../utils/fs.js";
import type { AgentFileResult } from "./index.js";

export type McpClient = "claude" | "cursor" | "vscode";

type McpServerEntry =
  | { command: string; args: string[] }
  | { type: "stdio"; command: string; args: string[] };

type McpClientSpec = {
  id: McpClient;
  label: string;
  path: string;
  rootKey: "mcpServers" | "servers";
  detectPaths: readonly string[];
  buildEntry: (from?: string) => McpServerEntry;
};

function buildMcpArgs(from?: string): string[] {
  return from === undefined
    ? ["-y", "recontent", "mcp"]
    : ["-y", "recontent", "mcp", "--from", from];
}

export const MCP_CLIENTS: Record<McpClient, McpClientSpec> = {
  claude: {
    id: "claude",
    label: "Claude Code",
    path: ".mcp.json",
    rootKey: "mcpServers",
    detectPaths: [".mcp.json", ".claude", "CLAUDE.md"],
    buildEntry: (from) => ({ command: "npx", args: buildMcpArgs(from) }),
  },
  cursor: {
    id: "cursor",
    label: "Cursor",
    path: ".cursor/mcp.json",
    rootKey: "mcpServers",
    detectPaths: [".cursor/mcp.json", ".cursor"],
    buildEntry: (from) => ({ command: "npx", args: buildMcpArgs(from) }),
  },
  vscode: {
    id: "vscode",
    label: "VS Code",
    path: ".vscode/mcp.json",
    rootKey: "servers",
    detectPaths: [".vscode/mcp.json", ".vscode"],
    buildEntry: (from) => ({ type: "stdio", command: "npx", args: buildMcpArgs(from) }),
  },
};

export const MCP_CLIENT_NAMES: readonly McpClient[] = ["claude", "cursor", "vscode"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseMcpClients(values: string[]): McpClient[] {
  const result: McpClient[] = [];
  const seen = new Set<McpClient>();

  const rawItems = values
    .flatMap((value) => value.split(","))
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);

  if (rawItems.length === 0) {
    throw new Error(
      `Invalid --mcp value. Expected one or more of: ${MCP_CLIENT_NAMES.join(", ")}, all.`,
    );
  }

  for (const item of rawItems) {
    if (item === "all") {
      for (const client of MCP_CLIENT_NAMES) {
        if (!seen.has(client)) {
          seen.add(client);
          result.push(client);
        }
      }
      continue;
    }

    if (!Object.hasOwn(MCP_CLIENTS, item)) {
      throw new Error(
        `Unknown MCP client "${item}". Available clients: ${MCP_CLIENT_NAMES.join(", ")}, all.`,
      );
    }

    const client = item as McpClient;
    if (!seen.has(client)) {
      seen.add(client);
      result.push(client);
    }
  }

  return result;
}

export function detectMcpClients(cwd: string): McpClient[] {
  return MCP_CLIENT_NAMES.filter((client) =>
    MCP_CLIENTS[client].detectPaths.some((candidate) => fs.existsSync(path.join(cwd, candidate))),
  );
}

export async function writeMcpConfig(
  cwd: string,
  client: McpClient,
  options: { from?: string } = {},
): Promise<AgentFileResult> {
  const spec = MCP_CLIENTS[client];
  const target = path.join(cwd, spec.path);

  let existingText: string | undefined;
  try {
    existingText = await readFile(target, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  let root: Record<string, unknown> = {};
  if (existingText !== undefined) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(existingText);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Could not parse existing ${spec.path} as JSON (${detail}). Fix the file manually before running \`recontent init --mcp ${client}\`.`,
        { cause: error },
      );
    }

    if (!isPlainObject(parsed)) {
      throw new Error(
        `Expected ${spec.path} to contain a JSON object at the root. Fix the file manually before running \`recontent init --mcp ${client}\`.`,
      );
    }

    root = { ...parsed };
  }

  const existingServers = root[spec.rootKey];
  if (existingServers !== undefined && !isPlainObject(existingServers)) {
    throw new Error(
      `Expected "${spec.rootKey}" in ${spec.path} to be a JSON object. Fix the file manually before running \`recontent init --mcp ${client}\`.`,
    );
  }

  const servers: Record<string, unknown> = {
    ...existingServers,
    recontent: spec.buildEntry(options.from),
  };

  const next = {
    ...root,
    [spec.rootKey]: servers,
  };

  const content = `${JSON.stringify(next, null, 2)}\n`;
  const { path: writtenPath, skipReason } = await writeOutputFile(spec.path, content, cwd);
  return {
    path: writtenPath,
    status:
      skipReason === "unchanged" ? "unchanged" : existingText !== undefined ? "updated" : "created",
  };
}
