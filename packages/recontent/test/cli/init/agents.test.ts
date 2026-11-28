import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { detectDesignMd } from "../../../src/cli/commands/init/agents/index.js";
import {
  renderInstructionsBlock,
  upsertManagedBlock,
  writeInstructionsFile,
} from "../../../src/cli/commands/init/agents/instructions.js";
import { parseMcpClients, writeMcpConfig } from "../../../src/cli/commands/init/agents/mcp.js";
import {
  parseSkillTargets,
  renderProjectSkill,
  SKILL_TARGETS,
  writeProjectSkill,
} from "../../../src/cli/commands/init/agents/skill.js";
import { makeScratchDir, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("renderProjectSkill & writeProjectSkill", () => {
  test("renders CLI mode for producer and consumer with optional DESIGN.md", () => {
    const producer = renderProjectSkill({ mode: "cli", designMdPath: "docs/DESIGN.md" });
    expect(producer).toMatch(/^---\nname: recontent\n/);
    expect(producer).toContain("Read `docs/DESIGN.md` first");
    expect(producer).toContain("recontent inspect components <Name>");
    expect(producer).toContain("Exit code 2");
    expect(producer).toContain("Exit code 1");
    expect(producer).toContain("recontent build");
    expect(producer).not.toContain("get_design_system_overview");

    const consumer = renderProjectSkill({ mode: "cli", from: "@acme/ds" });
    expect(consumer).toContain("recontent inspect --from @acme/ds");
    expect(consumer).toContain("recontent inspect components <Name> --from @acme/ds");
    expect(consumer).not.toContain("recontent build");
    expect(consumer).not.toContain("DESIGN.md");

    const quoted = renderProjectSkill({ mode: "cli", from: "./$HOME/design(v2)/it's.json" });
    expect(quoted).toContain("recontent inspect --from './$HOME/design(v2)/it'\\''s.json'");

    const customConfig = renderProjectSkill({ mode: "cli", config: "tokens.config.ts" });
    expect(customConfig).toContain("recontent inspect -c tokens.config.ts");
    expect(customConfig).toContain("recontent build -c tokens.config.ts");
  });

  test("renders MCP mode without CLI inspect commands", () => {
    const skill = renderProjectSkill({ mode: "mcp", from: "@acme/ds", designMdPath: "DESIGN.md" });
    expect(skill).toContain("Read `DESIGN.md` first");
    expect(skill).toContain("get_design_system_overview");
    expect(skill).toContain("list_components");
    expect(skill).toContain("get_components");
    expect(skill).toContain("get_tokens");
    expect(skill).toContain("get_component_types");
    expect(skill).toContain("search_design_system");
    expect(skill).toContain("Did you mean");
    expect(skill).toContain("this project's design system");
    expect(skill).not.toContain("@acme/ds");
    expect(skill).not.toContain("recontent inspect");
    expect(skill).not.toContain("recontent build");
  });

  test("parseSkillTargets and writeProjectSkill support .agents and .claude targets", async () => {
    expect(parseSkillTargets(true)).toEqual(["agents"]);
    expect(parseSkillTargets("claude")).toEqual(["claude"]);
    expect(parseSkillTargets("agents,claude")).toEqual(["agents", "claude"]);
    expect(parseSkillTargets(["agents", "claude"])).toEqual(["agents", "claude"]);
    expect(parseSkillTargets([true, "claude"])).toEqual(["agents", "claude"]);
    expect(parseSkillTargets("all")).toEqual(["agents", "claude"]);
    expect(() => parseSkillTargets("cursor")).toThrow(/Unknown skill target "cursor"/);

    const dir = makeScratchDir("agent-skill");

    const first = await writeProjectSkill(dir, { mode: "cli" });
    expect(first).toEqual({ path: path.join(dir, SKILL_TARGETS.agents.path), status: "created" });

    const second = await writeProjectSkill(dir, { mode: "cli" });
    expect(second.status).toBe("unchanged");

    const third = await writeProjectSkill(dir, { mode: "mcp" });
    expect(third.status).toBe("updated");
    expect(readFileSync(third.path, "utf-8")).toContain("get_design_system_overview");

    const claude = await writeProjectSkill(dir, { mode: "cli" }, "claude");
    expect(claude).toEqual({ path: path.join(dir, SKILL_TARGETS.claude.path), status: "created" });
  });
});

describe("parseMcpClients & writeMcpConfig", () => {
  test("parses comma-separated, repeatable, deduplicated, and all values", () => {
    expect(parseMcpClients(["claude,cursor", "cursor"])).toEqual(["claude", "cursor"]);
    expect(parseMcpClients(["all"])).toEqual(["claude", "cursor", "vscode"]);
    expect(() => parseMcpClients(["unknown"])).toThrow(/Unknown MCP client "unknown"/);
  });

  test("writes claude, cursor, and vscode configs with --from and preserves existing servers", async () => {
    const dir = makeScratchDir("agent-mcp");
    writeFileSync(
      path.join(dir, ".mcp.json"),
      JSON.stringify({ extraKey: true, mcpServers: { other: { command: "other-mcp" } } }, null, 2),
    );

    const claude = await writeMcpConfig(dir, "claude", { from: "@acme/ds" });
    expect(claude.status).toBe("updated");
    expect(JSON.parse(readFileSync(claude.path, "utf-8"))).toEqual({
      extraKey: true,
      mcpServers: {
        other: { command: "other-mcp" },
        recontent: { command: "npx", args: ["-y", "recontent", "mcp", "--from", "@acme/ds"] },
      },
    });

    const claudeAgain = await writeMcpConfig(dir, "claude", { from: "@acme/ds" });
    expect(claudeAgain.status).toBe("unchanged");

    const cursor = await writeMcpConfig(dir, "cursor", { config: "tokens.config.ts" });
    expect(cursor.status).toBe("created");
    expect(JSON.parse(readFileSync(cursor.path, "utf-8"))).toEqual({
      mcpServers: {
        recontent: { command: "npx", args: ["-y", "recontent", "mcp", "-c", "tokens.config.ts"] },
      },
    });

    const vscode = await writeMcpConfig(dir, "vscode", { from: "@acme/ds" });
    expect(vscode.status).toBe("created");
    expect(JSON.parse(readFileSync(vscode.path, "utf-8"))).toEqual({
      servers: {
        recontent: {
          type: "stdio",
          command: "npx",
          args: ["-y", "recontent", "mcp", "--from", "@acme/ds"],
        },
      },
    });
  });

  test("rejects invalid JSON without overwriting the file", async () => {
    const dir = makeScratchDir("agent-mcp-invalid");
    const mcpPath = path.join(dir, ".mcp.json");
    writeFileSync(mcpPath, "{ // comment\n");

    await expect(writeMcpConfig(dir, "claude")).rejects.toThrow(
      /Could not parse existing \.mcp\.json/,
    );
    expect(readFileSync(mcpPath, "utf-8")).toBe("{ // comment\n");
  });
});

describe("upsertManagedBlock & writeInstructionsFile", () => {
  test("creates, appends, updates in place, and rejects malformed markers", async () => {
    const cliBlock = renderInstructionsBlock({ mode: "cli", designMdPath: "DESIGN.md" });
    const mcpBlock = renderInstructionsBlock({ mode: "mcp", from: "@acme/ds" });

    expect(cliBlock).toContain("recontent inspect components <Name>");
    expect(cliBlock).toContain("Read `DESIGN.md` first.");
    expect(cliBlock).toContain("recontent build");
    expect(mcpBlock).toContain("get_design_system_overview");
    expect(mcpBlock).toContain("this project's design system");
    expect(mcpBlock).not.toContain("@acme/ds");
    expect(mcpBlock).not.toContain("recontent inspect");
    expect(mcpBlock).not.toContain("recontent build");

    expect(upsertManagedBlock(undefined, cliBlock)).toBe(`${cliBlock}\n`);

    const appended = upsertManagedBlock("# Project\n\nExisting notes.\n", cliBlock);
    expect(appended).toBe(`# Project\n\nExisting notes.\n\n${cliBlock}\n`);

    const replaced = upsertManagedBlock(`${appended}\nFooter.\n`, mcpBlock);
    expect(replaced).toBe(`# Project\n\nExisting notes.\n\n${mcpBlock}\n\nFooter.\n`);

    expect(() => upsertManagedBlock("<!-- recontent:start -->\nno end", cliBlock)).toThrow(
      /Malformed Recontent markers/,
    );
    expect(() =>
      upsertManagedBlock("<!-- recontent:end -->\n<!-- recontent:start -->", cliBlock),
    ).toThrow(/Malformed Recontent markers/);

    const dir = makeScratchDir("agent-instructions");
    const created = await writeInstructionsFile(dir, "AGENTS.md", { mode: "cli" });
    expect(created.status).toBe("created");
    const unchanged = await writeInstructionsFile(dir, "AGENTS.md", { mode: "cli" });
    expect(unchanged.status).toBe("unchanged");
    const updated = await writeInstructionsFile(dir, "AGENTS.md", { mode: "mcp" });
    expect(updated.status).toBe("updated");
  });
});

describe("detectDesignMd", () => {
  test("prefers DESIGN.md over docs/DESIGN.md and returns undefined when absent", () => {
    const dir = makeScratchDir("agent-design-md");
    expect(detectDesignMd(dir)).toBeUndefined();

    mkdirSync(path.join(dir, "docs"));
    writeFileSync(path.join(dir, "docs/DESIGN.md"), "# Design\n");
    expect(detectDesignMd(dir)).toBe("docs/DESIGN.md");

    writeFileSync(path.join(dir, "DESIGN.md"), "# Design\n");
    expect(detectDesignMd(dir)).toBe("DESIGN.md");
  });
});
