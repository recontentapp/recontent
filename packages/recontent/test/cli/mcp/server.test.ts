import { describe, expect, jest, test } from "@jest/globals";
import type { InspectExecution, InspectTarget } from "../../../src/cli/commands/inspect/index.js";
import { TOKEN_LAYERS, TOKEN_TYPES } from "../../../src/cli/commands/inspect/select.js";
import { createMcpServer } from "../../../src/cli/commands/mcp/server.js";

type Message = Record<string, any>;

/** The server on an in-memory transport: send a request, get its reply. */
async function connect(
  options: {
    result?: InspectExecution;
    hasComponents?: boolean;
  } = {},
) {
  const result = options.result ?? { ok: true, output: "# Overview", warnings: [] };
  const inspect = jest.fn(async (_target: InspectTarget) => result);
  const server = createMcpServer({
    version: "1.2.3",
    inspect,
    hasComponents: options.hasComponents,
  });
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
  const call = async (name: string, args?: unknown) =>
    (
      await request("tools/call", {
        name,
        ...(args !== undefined ? { arguments: args } : {}),
      })
    ).result;
  return { inspect, request, call };
}

describe("MCP server", () => {
  test("exposes six read-only tools with strict schemas and enum constraints", async () => {
    const { request } = await connect();
    const { tools } = (await request("tools/list")).result;
    expect(tools.map((tool: Message) => tool.name)).toEqual([
      "get_design_system_overview",
      "get_tokens",
      "list_components",
      "get_components",
      "get_component_types",
      "search_design_system",
    ]);

    for (const tool of tools) {
      expect(tool).toMatchObject({
        title: expect.any(String),
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        inputSchema: { additionalProperties: false },
      });
    }

    const byName = Object.fromEntries(tools.map((tool: Message) => [tool.name, tool]));
    expect(byName.get_tokens.inputSchema.properties.layer.enum).toEqual([...TOKEN_LAYERS]);
    expect(byName.get_tokens.inputSchema.properties.type.enum).toEqual([...TOKEN_TYPES]);
    expect(byName.get_components.inputSchema.required).toEqual(["names"]);
    expect(byName.search_design_system.inputSchema.required).toEqual(["queries"]);
  });

  test("omits component and type tools when serving a token-only snapshot", async () => {
    const { request, call, inspect } = await connect({ hasComponents: false });
    const { tools } = (await request("tools/list")).result;
    expect(tools.map((tool: Message) => tool.name)).toEqual([
      "get_design_system_overview",
      "get_tokens",
      "search_design_system",
    ]);
    const searchTool = tools.find((tool: Message) => tool.name === "search_design_system");
    expect(searchTool.inputSchema.properties.scope).toBeUndefined();

    await call("search_design_system", { queries: ["accent"] });
    expect(inspect).toHaveBeenCalledWith({
      kind: "search",
      queries: ["accent"],
      scope: ["tokens"],
    });
  });

  test.each<[string, string, Record<string, unknown> | undefined, InspectTarget]>([
    ["overview with empty args", "get_design_system_overview", {}, { kind: "overview" }],
    ["overview with omitted args", "get_design_system_overview", undefined, { kind: "overview" }],
    [
      "tokens with filters",
      "get_tokens",
      { paths: ["system.color"], layer: "system", type: "color", theme: "dark", deprecated: true },
      {
        kind: "tokens",
        paths: ["system.color"],
        layer: "system",
        type: "color",
        theme: "dark",
        deprecated: true,
      },
    ],
    [
      "tokens summary",
      "get_tokens",
      {},
      {
        kind: "tokens",
        paths: [],
        layer: undefined,
        type: undefined,
        theme: undefined,
        deprecated: undefined,
      },
    ],
    [
      "list components",
      "list_components",
      { category: "Actions", deprecated: true },
      { kind: "components", names: [], category: "Actions", deprecated: true },
    ],
    [
      "get components",
      "get_components",
      { names: ["Button"], props: ["size"] },
      { kind: "components", names: ["Button"], props: ["size"] },
    ],
    [
      "get component types",
      "get_component_types",
      { names: ["TabItem"] },
      { kind: "types", names: ["TabItem"], deprecated: undefined },
    ],
    [
      "list component types",
      "get_component_types",
      {},
      { kind: "types", names: [], deprecated: undefined },
    ],
    [
      "search with scope",
      "search_design_system",
      { queries: ["#fff"], scope: ["tokens"] },
      { kind: "search", queries: ["#fff"], scope: ["tokens"] },
    ],
  ])("%s maps to an inspect target", async (_label, tool, args, target) => {
    const { call, inspect } = await connect();
    expect(await call(tool, args)).toMatchObject({
      content: [{ type: "text", text: "# Overview" }],
    });
    expect(inspect).toHaveBeenCalledWith(target);
  });

  test("a failed lookup is a tool error that keeps the suggestions", async () => {
    const { call } = await connect({
      result: {
        ok: false,
        exitCode: 2,
        errors: [{ message: 'No component "Buton". Did you mean Button?' }],
      },
    });
    expect(await call("get_components", { names: ["Buton"] })).toMatchObject({
      content: [{ type: "text", text: 'No component "Buton". Did you mean Button?' }],
      isError: true,
    });
  });

  test.each<[string, string, unknown]>([
    ["unknown argument on overview", "get_design_system_overview", { verbose: true }],
    ["invalid token type", "get_tokens", { type: "colour" }],
    ["invalid token layer", "get_tokens", { layer: "primitive" }],
    ["paths as string instead of array", "get_tokens", { paths: "system" }],
    ["missing names on get_components", "get_components", { props: ["size"] }],
    ["empty names on get_components", "get_components", { names: [] }],
    ["empty queries on search", "search_design_system", { queries: [] }],
    ["invalid scope on search", "search_design_system", { queries: ["red"], scope: ["themes"] }],
  ])("%s is rejected as a tool error before calling inspect", async (_label, tool, args) => {
    const { call, inspect } = await connect();
    expect((await call(tool, args)).isError).toBe(true);
    expect(inspect).not.toHaveBeenCalled();
  });
});
