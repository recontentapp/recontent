import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "@jest/globals";
import {
  binPath,
  copyFixture,
  linkReactTypes,
  makeScratchDir,
  runCli,
  useCliScratch,
} from "../../helpers/cli.js";

useCliScratch();

type Reply = Record<string, any>;

const INITIALIZE = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "test", version: "1" },
};

/** An MCP client on the built binary's stdio. */
function startServer(args: string[]) {
  const child = spawn("node", [binPath, "mcp", ...args], { stdio: ["pipe", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));
  const exited = new Promise<number | null>((resolve) => child.on("close", resolve));

  const waiting = new Map<number, (reply: Reply) => void>();
  let read = 0;
  const poll = () => {
    const lines = stdout.split("\n");
    for (; read < lines.length - 1; read++) {
      const reply = JSON.parse(lines[read]!) as Reply;
      waiting.get(reply.id)?.(reply);
    }
  };
  child.stdout.on("data", poll);

  let nextId = 1;
  const request = (method: string, params?: unknown) =>
    new Promise<Reply>((resolve) => {
      const id = nextId++;
      waiting.set(id, resolve);
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  const call = async (name: string, toolArgs: object = {}) =>
    (await request("tools/call", { name, arguments: toolArgs })).result;

  return {
    request,
    call,
    notify: (method: string) =>
      child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method })}\n`),
    close: async () => {
      child.stdin.end();
      const code = await exited;
      return { code, stdout, stderr };
    },
  };
}

const text = (result: Reply) => result.content[0].text as string;

describe("recontent mcp", () => {
  test("serves a project over stdio, reloads its config, and exits when stdin closes", async () => {
    const dir = makeScratchDir("mcp");
    copyFixture("inspect", dir);
    linkReactTypes(dir);
    const server = startServer(["--cwd", dir, "--log-level", "debug"]);

    const init = await server.request("initialize", INITIALIZE);
    expect(init.result.serverInfo.name).toBe("recontent");
    server.notify("notifications/initialized");

    const { tools } = (await server.request("tools/list")).result;
    expect(tools.map((tool: Reply) => tool.name)).toEqual([
      "get_design_system_overview",
      "get_tokens",
      "list_components",
      "get_components",
      "get_component_types",
      "search_design_system",
    ]);

    const overview = text(await server.call("get_design_system_overview"));
    expect(overview).toContain("# Overview");
    // MCP responses omit CLI Next: hints.
    expect(overview).not.toContain("Next:");
    expect(overview).not.toContain("recontent inspect");

    expect(text(await server.call("list_components"))).toContain("`Button`");
    expect(text(await server.call("get_components", { names: ["Button"] }))).toContain("variant");

    const emptySearch = await server.call("search_design_system", { queries: [" "] });
    expect(emptySearch.isError).toBe(true);
    expect(text(emptySearch)).not.toContain("recontent inspect");

    const typo = await server.call("get_components", { names: ["Buton"] });
    expect(typo.isError).toBe(true);
    expect(text(typo)).toContain("Button");

    // Tokens edited during the session show up in the next request.
    const config = path.join(dir, "recontent.config.ts");
    writeFileSync(config, readFileSync(config, "utf-8").replace("#2563eb", "#123456"));
    expect(text(await server.call("get_tokens", { paths: ["system.color.accent"] }))).toContain(
      "#123456",
    );

    // A config that does not load is an error to answer with, and recovers once fixed.
    const good = readFileSync(config, "utf-8");
    writeFileSync(config, "export default {");
    expect((await server.call("get_design_system_overview")).isError).toBe(true);
    writeFileSync(config, good);
    expect(text(await server.call("get_design_system_overview"))).toContain("# Overview");

    const { code, stdout, stderr } = await server.close();
    expect(code).toBe(0);
    // stdout is the protocol, and nothing else.
    for (const line of stdout.trim().split("\n")) expect(JSON.parse(line).jsonrpc).toBe("2.0");
    expect(stderr).toContain("debug:");
  }, 60_000);

  test("--from serves an installed package's snapshot, and follows its updates", async () => {
    const system = makeScratchDir("mcp-system");
    copyFixture("inspect", system);
    linkReactTypes(system);
    expect(runCli(["--cwd", system, "build"]).status).toBe(0);

    const app = makeScratchDir("mcp-app");
    const installed = path.join(app, "node_modules/@acme/ds");
    mkdirSync(path.join(installed, "dist"), { recursive: true });
    const snapshot = path.join(installed, "dist/recontent.json");
    copyFileSync(path.join(system, "dist/recontent.json"), snapshot);
    writeFileSync(
      path.join(installed, "package.json"),
      JSON.stringify({ name: "@acme/ds", version: "1.0.0", recontent: "./dist/recontent.json" }),
    );

    const server = startServer(["--from", "@acme/ds", "--cwd", app]);
    await server.request("initialize", INITIALIZE);
    expect(text(await server.call("get_design_system_overview"))).toContain("@acme/ds@1.0.0");
    expect(text(await server.call("get_components", { names: ["Button"] }))).toContain("variant");

    writeFileSync(snapshot, readFileSync(snapshot, "utf-8").replaceAll("#2563eb", "#123456"));
    expect(text(await server.call("get_tokens", { paths: ["system.color.accent"] }))).toContain(
      "#123456",
    );
    expect((await server.close()).code).toBe(0);
  }, 60_000);

  test("--from with a token-only snapshot omits component and type tools", async () => {
    const dir = makeScratchDir("mcp-tokens-only");
    const snapshot = path.join(dir, "recontent.json");
    writeFileSync(
      snapshot,
      JSON.stringify({
        schemaVersion: "2",
        kind: "snapshot",
        themes: [],
        tokens: [
          {
            layer: "system",
            path: "system.color.accent",
            name: "accent",
            type: "color",
            cssVar: "--system-color-accent",
            values: { default: "#2563eb" },
          },
        ],
      }),
    );

    const server = startServer(["--from", snapshot, "--cwd", dir]);
    await server.request("initialize", INITIALIZE);
    const { tools } = (await server.request("tools/list")).result;
    expect(tools.map((tool: Reply) => tool.name)).toEqual([
      "get_design_system_overview",
      "get_tokens",
      "search_design_system",
    ]);
    expect(text(await server.call("get_tokens", { layer: "system", type: "color" }))).toContain(
      "system.color.accent",
    );
    expect((await server.close()).code).toBe(0);
  }, 60_000);

  test("fails before serving when there is nothing to serve", () => {
    const empty = makeScratchDir("mcp-empty");
    const missingConfig = runCli(["--cwd", empty, "mcp"]);
    expect(missingConfig.status).toBe(1);
    expect(missingConfig.stderr).toContain("--from");

    const missingPackage = runCli(["--cwd", empty, "mcp", "--from", "@acme/nope"]);
    expect(missingPackage.status).toBe(1);
    expect(missingPackage.stderr).toContain("is not installed");
    expect(missingPackage.stdout).toBe("");

    expect(runCli(["--cwd", empty, "-c", "a.ts", "mcp", "--from", "@acme/ds"]).status).toBe(1);
    expect(runCli(["--cwd", empty, "mcp", "--from", "@acme/ds", "--no-cache"]).status).toBe(1);
  });
});
