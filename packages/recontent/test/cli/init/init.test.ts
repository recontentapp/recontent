import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import { PRESET_NAMES } from "../../../src/cli/commands/init/presets/index.js";
import { copyFixture, makeScratchDir, runCli, useCliScratch } from "../../helpers/cli.js";

useCliScratch();

describe("recontent init", () => {
  test("--force overwrites a stale config, and succeeds on an up-to-date one, run after run", () => {
    const dir = makeScratchDir("init-force");
    runCli(["--cwd", dir, "init", "--preset", "neutral"]);
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// stale\n");

    expect(runCli(["--cwd", dir, "init", "--preset", "neutral", "--force"]).status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");

    const again = runCli(["--cwd", dir, "init", "--preset", "neutral", "--force"]);
    expect(again.status).toBe(0);
    expect(again.stderr).not.toContain("already exists");
  });

  test("-c may point outside --cwd", () => {
    const dir = makeScratchDir("init-config-outside");
    const cwd = path.join(dir, "app");
    mkdirSync(cwd);

    const result = runCli([
      "--cwd",
      cwd,
      "init",
      "--preset",
      "neutral",
      "-c",
      "../shared.config.ts",
    ]);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(dir, "shared.config.ts"))).toBe(true);
  });

  test("honors -c for the file it writes, and says so in its messages", () => {
    const dir = makeScratchDir("init-config-flag");
    const result = runCli(["--cwd", dir, "init", "--preset", "neutral", "-c", "tokens.config.ts"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("Created tokens.config.ts");
    expect(result.stderr).toContain("recontent build");
    expect(existsSync(path.join(dir, "tokens.config.ts"))).toBe(true);

    const again = runCli(["--cwd", dir, "init", "--preset", "neutral", "-c", "tokens.config.ts"]);
    expect(again.status).toBe(1);
    expect(again.stderr).toContain("tokens.config.ts already exists");
  });

  test("bare init in non-TTY exits 1 with usage hint", () => {
    const dir = makeScratchDir("init-non-tty");
    const result = runCli(["--cwd", dir, "init"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("TTY");
    expect(result.stderr).toContain("--preset");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });

  test("rejects an unknown preset and lists the choices", () => {
    const dir = makeScratchDir("init-unknown");
    const result = runCli(["--cwd", dir, "init", "--preset", "bootstrap"]);

    expect(result.status).toBe(1);
    for (const name of PRESET_NAMES) {
      expect(result.stderr).toContain(name);
    }
  });

  test.each(PRESET_NAMES)("the %s preset scaffolds a config that builds", (name) => {
    const dir = makeScratchDir(`init-${name}`);

    expect(runCli(["--cwd", dir, "init", "--preset", name]).status).toBe(0);
    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });
});

describe("recontent init agent onboarding", () => {
  test("producer CLI mode scaffolds config, skill, and AGENTS.md", () => {
    const dir = makeScratchDir("init-producer-cli");
    const result = runCli(["--cwd", dir, "init", "--preset", "neutral", "--skill", "--agents-md"]);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(true);
    const skill = readFileSync(path.join(dir, ".agents/skills/recontent/SKILL.md"), "utf-8");
    expect(skill).toContain("recontent inspect components <Name>");
    expect(skill).toContain("recontent build");
    const agentsMd = readFileSync(path.join(dir, "AGENTS.md"), "utf-8");
    expect(agentsMd).toContain("<!-- recontent:start -->");
    expect(agentsMd).toContain("recontent inspect");
  });

  test("consumer MCP mode writes client configs, skill, and CLAUDE.md without scaffolding config", () => {
    const dir = makeScratchDir("init-consumer-mcp");
    const result = runCli([
      "--cwd",
      dir,
      "init",
      "--from",
      "@acme/ds",
      "--mcp",
      "claude,vscode",
      "--skill",
      "all",
      "--claude-md",
    ]);

    expect(result.status).toBe(0);
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);

    const claudeMcp = JSON.parse(readFileSync(path.join(dir, ".mcp.json"), "utf-8"));
    expect(claudeMcp.mcpServers.recontent).toEqual({
      command: "npx",
      args: ["-y", "recontent", "mcp", "--from", "@acme/ds"],
    });

    const vscodeMcp = JSON.parse(readFileSync(path.join(dir, ".vscode/mcp.json"), "utf-8"));
    expect(vscodeMcp.servers.recontent).toEqual({
      type: "stdio",
      command: "npx",
      args: ["-y", "recontent", "mcp", "--from", "@acme/ds"],
    });

    const agentsSkill = readFileSync(path.join(dir, ".agents/skills/recontent/SKILL.md"), "utf-8");
    expect(agentsSkill).toContain("get_design_system_overview");
    expect(agentsSkill).not.toContain("recontent inspect");

    const claudeSkill = readFileSync(path.join(dir, ".claude/skills/recontent/SKILL.md"), "utf-8");
    expect(claudeSkill).toBe(agentsSkill);

    const claudeMd = readFileSync(path.join(dir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("get_design_system_overview");
    expect(claudeMd).not.toContain("recontent build");
  });

  test("-y scaffolds neutral + CLI skill in empty dir, and consumer CLI skill only with --from", () => {
    const producerDir = makeScratchDir("init-yes-producer");
    const producer = runCli(["--cwd", producerDir, "init", "-y"]);
    expect(producer.status).toBe(0);
    expect(existsSync(path.join(producerDir, "recontent.config.ts"))).toBe(true);
    expect(existsSync(path.join(producerDir, ".agents/skills/recontent/SKILL.md"))).toBe(true);

    const consumerDir = makeScratchDir("init-yes-consumer");
    const consumer = runCli(["--cwd", consumerDir, "init", "--from", "@acme/ds", "-y"]);
    expect(consumer.status).toBe(0);
    expect(existsSync(path.join(consumerDir, "recontent.config.ts"))).toBe(false);
    const skill = readFileSync(
      path.join(consumerDir, ".agents/skills/recontent/SKILL.md"),
      "utf-8",
    );
    expect(skill).toContain("recontent inspect --from @acme/ds");

    const mjsDir = makeScratchDir("init-yes-existing-mjs");
    writeFileSync(path.join(mjsDir, "recontent.config.mjs"), "export default {};\n");
    const mjsResult = runCli(["--cwd", mjsDir, "init", "-y"]);
    expect(mjsResult.status).toBe(0);
    expect(existsSync(path.join(mjsDir, "recontent.config.ts"))).toBe(false);
    expect(existsSync(path.join(mjsDir, ".agents/skills/recontent/SKILL.md"))).toBe(true);

    writeFileSync(path.join(producerDir, "recontent.config.ts"), "// stale\n");
    const forced = runCli(["--cwd", producerDir, "init", "-y", "--force"]);
    expect(forced.status).toBe(0);
    expect(readFileSync(path.join(producerDir, "recontent.config.ts"), "utf-8")).toContain(
      "defineConfig(",
    );
  });

  test("propagates -c to MCP configs, skills, and instructions, and supports repeatable --skill", () => {
    const dir = makeScratchDir("init-custom-config-agents");
    const result = runCli([
      "--cwd",
      dir,
      "init",
      "--preset",
      "neutral",
      "-c",
      "tokens.config.ts",
      "--mcp",
      "claude",
      "--skill",
      "agents",
      "--skill",
      "claude",
      "--agents-md",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("recontent build -c tokens.config.ts");
    expect(result.stderr).toContain("reload your MCP client");

    const mcp = JSON.parse(readFileSync(path.join(dir, ".mcp.json"), "utf-8"));
    expect(mcp.mcpServers.recontent.args).toEqual([
      "-y",
      "recontent",
      "mcp",
      "-c",
      "tokens.config.ts",
    ]);
    expect(readFileSync(path.join(dir, ".agents/skills/recontent/SKILL.md"), "utf-8")).toContain(
      "recontent build -c tokens.config.ts",
    );
    expect(existsSync(path.join(dir, ".claude/skills/recontent/SKILL.md"))).toBe(true);
    expect(readFileSync(path.join(dir, "AGENTS.md"), "utf-8")).toContain(
      "recontent build -c tokens.config.ts",
    );
  });

  test("writes nothing when agent validation fails alongside config scaffolding", () => {
    const dir = makeScratchDir("init-atomic-failure");
    writeFileSync(path.join(dir, ".mcp.json"), "{ invalid json\n");

    const result = runCli([
      "--cwd",
      dir,
      "init",
      "--preset",
      "neutral",
      "--mcp",
      "claude",
      "--skill",
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Could not parse existing .mcp.json");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
    expect(existsSync(path.join(dir, ".agents/skills/recontent/SKILL.md"))).toBe(false);
  });

  test("validates incompatible flags, empty --from, and invalid --mcp client", () => {
    const dir = makeScratchDir("init-flag-errors");

    const emptyFrom = runCli(["--cwd", dir, "init", "--from", "   ", "--skill"]);
    expect(emptyFrom.status).toBe(1);
    expect(emptyFrom.stderr).toContain("--from");

    const fromWithPreset = runCli([
      "--cwd",
      dir,
      "init",
      "--from",
      "@acme/ds",
      "--preset",
      "neutral",
    ]);
    expect(fromWithPreset.status).toBe(1);
    expect(fromWithPreset.stderr).toContain("--from");

    const fromWithConfig = runCli([
      "--cwd",
      dir,
      "init",
      "--from",
      "@acme/ds",
      "--skill",
      "-c",
      "custom.config.ts",
    ]);
    expect(fromWithConfig.status).toBe(1);
    expect(fromWithConfig.stderr).toContain("-c, --config");

    const badMcp = runCli(["--cwd", dir, "init", "--mcp", "zed"]);
    expect(badMcp.status).toBe(1);
    expect(badMcp.stderr).toContain('Unknown MCP client "zed"');
  });

  test("validates snapshot JSON files passed to --from before writing", () => {
    const dir = makeScratchDir("init-from-snapshot-validation");

    const missing = runCli(["--cwd", dir, "init", "--from", "./missing.json", "--skill"]);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("Cannot read");
    expect(existsSync(path.join(dir, ".agents/skills/recontent/SKILL.md"))).toBe(false);

    writeFileSync(path.join(dir, "bad.json"), JSON.stringify({ hello: "world" }));
    const invalid = runCli(["--cwd", dir, "init", "--from", "./bad.json", "--skill"]);
    expect(invalid.status).toBe(1);
    expect(invalid.stderr).toContain("not a recontent snapshot");
    expect(existsSync(path.join(dir, ".agents/skills/recontent/SKILL.md"))).toBe(false);

    writeFileSync(
      path.join(dir, "recontent.json"),
      JSON.stringify({ schemaVersion: "2", kind: "snapshot", themes: [], tokens: [] }),
    );
    const valid = runCli([
      "--cwd",
      dir,
      "init",
      "--from",
      "./recontent.json",
      "--mcp",
      "claude",
      "--skill",
      "--agents-md",
    ]);
    expect(valid.status).toBe(0);
    expect(
      readFileSync(path.join(dir, ".agents/skills/recontent/SKILL.md"), "utf-8"),
    ).not.toContain("recontent.json");
    expect(readFileSync(path.join(dir, "AGENTS.md"), "utf-8")).not.toContain("recontent.json");
  });
});

describe("recontent init --dtcg", () => {
  const resolver = "fixture.resolver.json";

  function initFromFixture(prefix: string, extraArgs: string[] = []) {
    const dir = makeScratchDir(prefix);
    copyFixture("dtcg", dir);
    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver, ...extraArgs]);
    return { dir, result };
  }

  test("generates a config from a resolver that builds", () => {
    const { dir, result } = initFromFixture("init-from");

    expect(result.status).toBe(0);
    expect(result.stderr).toContain(
      "Imported 30 tokens (18 ref, 12 system) and 2 themes; skipped 6 entries",
    );
    expect(result.stderr).toContain('warning: Skipped "misc.fluid"');
    const config = readFileSync(path.join(dir, "recontent.config.ts"), "utf-8");
    expect(config).toContain("defineTheme(");

    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });

  test("is mutually exclusive with a preset", () => {
    const dir = makeScratchDir("init-from-and-preset");
    copyFixture("dtcg", dir);
    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver, "--preset", "neutral"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("mutually exclusive");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });

  test("accepts token files and directories", () => {
    const dir = makeScratchDir("init-from-files");
    copyFixture("dtcg", dir);
    const result = runCli([
      "--cwd",
      dir,
      "init",
      "--dtcg",
      "primitives.tokens.json",
      "--dtcg",
      "semantic.tokens.json",
    ]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("and 0 themes");
    expect(runCli(["--cwd", dir, "build"]).status).toBe(0);
  });

  test("refuses to overwrite an existing config without --force", () => {
    const { dir } = initFromFixture("init-from-noforce");
    const configPath = path.join(dir, "recontent.config.ts");
    writeFileSync(configPath, "// mine\n");

    const result = runCli(["--cwd", dir, "init", "--dtcg", resolver]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--force");
    expect(readFileSync(configPath, "utf-8")).toBe("// mine\n");

    expect(runCli(["--cwd", dir, "init", "--dtcg", resolver, "--force"]).status).toBe(0);
    expect(readFileSync(configPath, "utf-8")).toContain("defineConfig(");
  });

  test("fails with a clear error for a missing source", () => {
    const dir = makeScratchDir("init-from-missing");
    const result = runCli(["--cwd", dir, "init", "--dtcg", "nope.resolver.json"]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("does not exist");
    expect(existsSync(path.join(dir, "recontent.config.ts"))).toBe(false);
  });
});
