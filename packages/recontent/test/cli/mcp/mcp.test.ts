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
  const inspect = async (args: object) =>
    (await request("tools/call", { name: "recontent_inspect", arguments: args })).result;

  return {
    request,
    inspect,
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
    expect((await server.request("tools/list")).result.tools[0].name).toBe("recontent_inspect");

    const overview = text(await server.inspect({ target: "overview" }));
    expect(overview).toContain("# Overview");
    // What to look at next is a tool call, not a command line.
    expect(overview).toMatch(/Next: `recontent_inspect \{"target":"tokens","query":\["[^"]+"\]\}`/);
    expect(overview).not.toContain("recontent inspect");
    expect(text(await server.inspect({ target: "components", query: ["Button"] }))).toContain(
      "variant",
    );
    const emptySearch = await server.inspect({ target: "search", query: [" "] });
    expect(emptySearch.isError).toBe(true);
    expect(text(emptySearch)).not.toContain("recontent inspect");
    const typo = await server.inspect({ target: "components", query: ["Buton"] });
    expect(typo.isError).toBe(true);
    expect(text(typo)).toContain("Button");

    // Tokens edited during the session show up in the next request.
    const config = path.join(dir, "recontent.config.ts");
    writeFileSync(config, readFileSync(config, "utf-8").replace("#2563eb", "#123456"));
    expect(
      text(await server.inspect({ target: "tokens", query: ["system.color.accent"] })),
    ).toContain("#123456");

    // A config that does not load is an error to answer with, and recovers once fixed.
    const good = readFileSync(config, "utf-8");
    writeFileSync(config, "export default {");
    expect((await server.inspect({ target: "overview" })).isError).toBe(true);
    writeFileSync(config, good);
    expect(text(await server.inspect({ target: "overview" }))).toContain("# Overview");

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
    expect(text(await server.inspect({ target: "overview" }))).toContain("@acme/ds@1.0.0");
    expect(text(await server.inspect({ target: "components", query: ["Button"] }))).toContain(
      "variant",
    );

    writeFileSync(snapshot, readFileSync(snapshot, "utf-8").replaceAll("#2563eb", "#123456"));
    expect(
      text(await server.inspect({ target: "tokens", query: ["system.color.accent"] })),
    ).toContain("#123456");
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
