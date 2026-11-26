import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { InspectExecution, InspectTarget } from "../inspect/index.js";

const INSTRUCTIONS =
  'Inspect the design system with `recontent_inspect`. Start with `target: "overview"`, then query specific `components`, `tokens`, `types`, or `search` on demand. If a lookup fails with "Did you mean", retry with the suggested name.';

// Strict, so that a misspelled argument is reported rather than silently ignored.
const inputSchema = z.strictObject({
  target: z
    .enum(["overview", "tokens", "components", "types", "search"])
    .describe('What to inspect. Start with "overview", then drill down.'),
  query: z
    .array(z.string())
    .optional()
    .describe(
      'Token paths/groups ("tokens"), component names ("components"), type names ("types"), or search terms (required for "search"). Omit for a summary list.',
    ),
  type: z.string().optional().describe('For "tokens": filter by token type (e.g. "color").'),
  theme: z.string().optional().describe('For "tokens": show values for this theme only.'),
  props: z
    .array(z.string())
    .optional()
    .describe('For "components": show only these props in full without shortening.'),
  deprecated: z
    .boolean()
    .optional()
    .describe('For "tokens", "components", or "types": only deprecated items.'),
});

function toTarget({
  target,
  query = [],
  type,
  theme,
  props,
  deprecated,
}: z.infer<typeof inputSchema>): InspectTarget {
  switch (target) {
    case "overview":
      return { kind: "overview" };
    case "tokens":
      return { kind: "tokens", paths: query, type, theme, deprecated };
    case "components":
      return { kind: "components", names: query, deprecated, props };
    case "types":
      return { kind: "types", names: query, deprecated };
    case "search":
      return { kind: "search", queries: query };
  }
}

const text = (content: string, isError = false) => ({
  content: [{ type: "text" as const, text: content }],
  ...(isError ? { isError } : {}),
});

/**
 * The MCP server, apart from its transport: one read-only tool that answers
 * with what `recontent inspect` prints. The SDK validates the arguments and
 * reports a bad one, or a thrown error, as a tool error for the model to correct.
 */
export function createMcpServer(options: {
  version: string;
  inspect: (target: InspectTarget) => Promise<InspectExecution>;
}): McpServer {
  const server = new McpServer(
    { name: "recontent", version: options.version },
    { instructions: INSTRUCTIONS },
  );
  server.registerTool(
    "recontent_inspect",
    {
      description:
        "Browse the design system as compact markdown. `overview`: counts, themes, components and types, the place to start. `tokens`: groups, or the tokens at or under the `query` dotted paths. `components`: one line each, or the props, import and usage of the `query` names. `types`: the project types components reference, or the `query` ones in full. `search`: tokens, components and types matching any `query` term.",
      inputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await options.inspect(toTarget(args));
      return result.ok
        ? text(result.output)
        : text(result.errors.map((error) => error.message).join("\n"), true);
    },
  );
  return server;
}
