import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import type { InspectExecution, InspectTarget } from "../inspect/index.js";
import { SEARCH_SCOPES, TOKEN_LAYERS, TOKEN_TYPES } from "../inspect/select.js";

const FULL_INSTRUCTIONS =
  'Query the design system before writing UI. Call `get_design_system_overview` first to see themes, token layers, components, and types, or `search_design_system` to find items by keyword, CSS variable, or raw value. Always call `get_components` before using a component to verify its exact import, props, and usage notes. If a lookup returns "Did you mean", retry with the suggested name.';

const TOKENS_ONLY_INSTRUCTIONS =
  'Query the design system tokens before writing UI. Call `get_design_system_overview` first to see themes and token layers, `get_tokens` to browse groups or inspect token values and CSS variables, or `search_design_system` to find tokens by keyword, CSS variable, or raw value. If a lookup returns "Did you mean", retry with the suggested name.';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const overviewInputSchema = z.strictObject({});

const tokensInputSchema = z.strictObject({
  paths: z
    .array(z.string().min(1))
    .optional()
    .describe('Exact token paths or group prefixes (e.g. ["system.color", "system.spacing.sm"]).'),
  layer: z
    .enum(TOKEN_LAYERS)
    .optional()
    .describe("Filter by token layer: ref, system, or components."),
  type: z
    .enum(TOKEN_TYPES)
    .optional()
    .describe("Filter by token type (e.g. color, dimension, typography)."),
  theme: z
    .string()
    .min(1)
    .optional()
    .describe("Show values for this theme only (in addition to default)."),
  deprecated: z.boolean().optional().describe("When true, return only deprecated tokens."),
});

const listComponentsInputSchema = z.strictObject({
  category: z.string().min(1).optional().describe("Filter to components in this category."),
  deprecated: z.boolean().optional().describe("When true, return only deprecated components."),
});

const getComponentsInputSchema = z.strictObject({
  names: z
    .array(z.string().min(1))
    .min(1)
    .describe('Component names to inspect (e.g. ["Button"] or ["Tabs"]).'),
  props: z
    .array(z.string().min(1))
    .optional()
    .describe(
      "Return only these prop names in full without truncation (includes inherited and shared props).",
    ),
});

const getComponentTypesInputSchema = z.strictObject({
  names: z
    .array(z.string().min(1))
    .optional()
    .describe('Type names or ids to inspect in full (e.g. ["TabItem"]). Omit to list all types.'),
  deprecated: z.boolean().optional().describe("When true, return only deprecated types."),
});

const searchFullInputSchema = z.strictObject({
  queries: z
    .array(z.string().min(1))
    .min(1)
    .describe('Search terms, CSS variables, or raw values (e.g. ["danger", "#ef4444"]).'),
  scope: z
    .array(z.enum(SEARCH_SCOPES))
    .min(1)
    .optional()
    .describe("Limit search to specific kinds. Omit to search everything."),
});

const searchTokensOnlyInputSchema = z.strictObject({
  queries: z
    .array(z.string().min(1))
    .min(1)
    .describe('Search terms, CSS variables, or raw values (e.g. ["danger", "#ef4444"]).'),
});

const reply = (result: InspectExecution) =>
  result.ok
    ? { content: [{ type: "text" as const, text: result.output }] }
    : {
        content: [
          { type: "text" as const, text: result.errors.map((error) => error.message).join("\n") },
        ],
        isError: true,
      };

/**
 * The MCP server, apart from its transport: read-only tools backed by the
 * design system snapshot. The SDK validates arguments against each tool's
 * strict schema and reports violations as tool errors for the model to correct.
 */
export function createMcpServer(options: {
  version: string;
  inspect: (target: InspectTarget) => Promise<InspectExecution>;
  /** Set to false when serving a token-only snapshot so component/type tools are omitted. */
  hasComponents?: boolean;
}): McpServer {
  const hasComponents = options.hasComponents ?? true;
  const run = async (target: InspectTarget) => reply(await options.inspect(target));

  const server = new McpServer(
    { name: "recontent", version: options.version },
    { instructions: hasComponents ? FULL_INSTRUCTIONS : TOKENS_ONLY_INSTRUCTIONS },
  );

  server.registerTool(
    "get_design_system_overview",
    {
      title: "Design System Overview",
      description: hasComponents
        ? "Get an overview of the design system: themes, token counts by layer, component names, and project type names. Start here to orient yourself."
        : "Get an overview of the design system: themes and token counts by layer. Start here to orient yourself.",
      inputSchema: overviewInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    () => run({ kind: "overview" }),
  );

  server.registerTool(
    "get_tokens",
    {
      title: "Get Design Tokens",
      description:
        "List token groups when called with no filters, or return resolved token values, theme overrides, CSS variables, aliases, and notes for tokens matching the filters.",
      inputSchema: tokensInputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    ({ paths = [], layer, type, theme, deprecated }) =>
      run({ kind: "tokens", paths, layer, type, theme, deprecated }),
  );

  if (hasComponents) {
    server.registerTool(
      "list_components",
      {
        title: "List Components",
        description:
          "List design system components grouped by category, with prop counts, status tags, and short descriptions. Use this to browse before calling get_components.",
        inputSchema: listComponentsInputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      ({ category, deprecated }) => run({ kind: "components", names: [], category, deprecated }),
    );

    server.registerTool(
      "get_components",
      {
        title: "Get Component Details",
        description:
          'Get full documentation for one or more components: import statement, source location, usage notes, examples, props table, and directly referenced types. A parent name like "Tabs" also includes subcomponents like "Tabs.Item".',
        inputSchema: getComponentsInputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      ({ names, props }) => run({ kind: "components", names, props }),
    );

    server.registerTool(
      "get_component_types",
      {
        title: "Get Component Types",
        description:
          "List project TypeScript types referenced by component props when called without names, or inspect specific types in full (members, literal values, and transitive type references).",
        inputSchema: getComponentTypesInputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      ({ names = [], deprecated }) => run({ kind: "types", names, deprecated }),
    );

    server.registerTool(
      "search_design_system",
      {
        title: "Search Design System",
        description:
          "Case-insensitive substring search across tokens (paths, values, CSS variables, descriptions), components (names, categories, descriptions, usage notes, props), and types. Multiple queries match as a union (OR).",
        inputSchema: searchFullInputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      ({ queries, scope }) => run({ kind: "search", queries, scope }),
    );
  } else {
    server.registerTool(
      "search_design_system",
      {
        title: "Search Design System",
        description:
          "Case-insensitive substring search across tokens (paths, values, CSS variables, aliases, descriptions). Multiple queries match as a union (OR).",
        inputSchema: searchTokensOnlyInputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      ({ queries }) => run({ kind: "search", queries, scope: ["tokens"] }),
    );
  }

  return server;
}
