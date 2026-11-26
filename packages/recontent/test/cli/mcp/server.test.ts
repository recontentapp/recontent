import { describe, expect, jest, test } from "@jest/globals";
import type { InspectExecution, InspectTarget } from "../../../src/cli/commands/inspect/index.js";
import { createMcpServer } from "../../../src/cli/commands/mcp/server.js";

type Message = Record<string, any>;

/** The server on an in-memory transport: send a request, get its reply. */
async function connect(
  result: InspectExecution = { ok: true, output: "# Overview", warnings: [] },
) {
  const inspect = jest.fn(async (_target: InspectTarget) => result);
  const server = createMcpServer({ version: "1.2.3", inspect });
  const replies = new Map<number, (reply: Message) => void>();
  const transport = {
    onmessage: undefined as ((message: Message) => void) | undefined,
    start: async () => {},
    close: async () => {},
    send: async (message: Message) => replies.get(message.id)?.(message),
  };
  await server.connect(transport as never);
  let id = 0;
  const request = (method: string, params?: unknown) =>
    new Promise<Message>((resolve) => {
      const requestId = ++id;
      replies.set(requestId, resolve);
      transport.onmessage?.({ jsonrpc: "2.0", id: requestId, method, params });
    });
  const call = async (args: unknown) =>
    (await request("tools/call", { name: "recontent_inspect", arguments: args })).result;
  return { inspect, request, call };
}

describe("recontent_inspect", () => {
  test("is the only tool, and it is read-only", async () => {
    const { request } = await connect();
    const { tools } = (await request("tools/list")).result;
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: "recontent_inspect",
      annotations: { readOnlyHint: true },
      inputSchema: { required: ["target"], additionalProperties: false },
    });
  });

  test.each<[string, Record<string, unknown>, InspectTarget]>([
    ["overview", { target: "overview" }, { kind: "overview" }],
    [
      "tokens",
      { target: "tokens", query: ["system.color"], type: "color", theme: "dark", deprecated: true },
      { kind: "tokens", paths: ["system.color"], type: "color", theme: "dark", deprecated: true },
    ],
    [
      "components",
      { target: "components", query: ["Button"], props: ["size"] },
      { kind: "components", names: ["Button"], props: ["size"], deprecated: undefined },
    ],
    ["types", { target: "types" }, { kind: "types", names: [], deprecated: undefined }],
    ["search", { target: "search", query: ["#fff"] }, { kind: "search", queries: ["#fff"] }],
  ])("%s maps its arguments to an inspect target", async (_name, args, target) => {
    const { call, inspect } = await connect();
    expect(await call(args)).toMatchObject({ content: [{ type: "text", text: "# Overview" }] });
    expect(inspect).toHaveBeenCalledWith(expect.objectContaining(target));
  });

  test("a failed lookup is a tool error that keeps the suggestions", async () => {
    const { call } = await connect({
      ok: false,
      exitCode: 2,
      errors: [{ message: 'No component "Buton". Did you mean Button?' }],
    });
    expect(await call({ target: "components", query: ["Buton"] })).toMatchObject({
      content: [{ type: "text", text: 'No component "Buton". Did you mean Button?' }],
      isError: true,
    });
  });

  test.each<[string, unknown]>([
    ["no target", {}],
    ["an unknown target", { target: "audit" }],
    ["a query that is not a list", { target: "tokens", query: "system" }],
    ["a deprecated flag that is not a boolean", { target: "tokens", deprecated: "yes" }],
    ["an unknown argument", { target: "overview", verbose: true }],
  ])("%s is a tool error, for the model to correct", async (_name, args) => {
    const { call, inspect } = await connect();
    expect((await call(args)).isError).toBe(true);
    expect(inspect).not.toHaveBeenCalled();
  });
});
