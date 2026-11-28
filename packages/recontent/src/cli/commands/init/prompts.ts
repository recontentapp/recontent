import { styleText } from "node:util";
import * as p from "@clack/prompts";
import { isSnapshotFilePath, readSnapshot } from "../../../snapshot/snapshot.js";
import { displayPath } from "../../utils/fs.js";
import type { AgentMode, InstructionFile, McpClient, SkillTarget } from "./agents/index.js";
import { detectMcpClients, MCP_CLIENT_NAMES, MCP_CLIENTS } from "./agents/mcp.js";
import { SKILL_TARGET_NAMES, SKILL_TARGETS } from "./agents/skill.js";
import { PRESETS } from "./presets/index.js";

const DESIGN_SYSTEM_QUIPS = [
  "Component docs that don't expire by next sprint.",
  "Rename a token without a company-wide scavenger hunt.",
  "Friends don't let friends hardcode #3b82f6.",
  "Because gray-450-final-v2 is not a design system.",
  "Ending the 47-shades-of-gray era, one token at a time.",
  "Dark mode shouldn't require a dark ritual.",
  "Design tokens in, pixel debates out.",
] as const;

function style(format: Parameters<typeof styleText>[0], text: string): string {
  return styleText(format, text, { stream: process.stdout });
}

function renderInitHeader(version: string): string {
  const quip = DESIGN_SYSTEM_QUIPS[Math.floor(Math.random() * DESIGN_SYSTEM_QUIPS.length)]!;

  return [
    "",
    `  ${style("redBright", "▄ ▄")}`,
    ` ${style("redBright", "█████")}     ${style("bold", "recontent")} ${style("dim", `v${version}`)}`,
    ` ${style("yellow", "▄ ▄")}   ${style("green", "▄")}   Design system toolchain for humans & agents`,
    `${style("yellow", "█████")} ${style("green", "███")}  ${style(["dim", "italic"], `"${quip}"`)}`,
    "",
  ].join("\n");
}

export type InitPlan = {
  source?: { preset: string } | { dtcg: string[] };
  from?: string;
  agents?: {
    mode: AgentMode;
    skills?: SkillTarget[];
    mcp?: McpClient[];
    instructions?: InstructionFile[];
    designMdPath?: string;
  };
};

type PromptContext = {
  cwd: string;
  configPath: string;
  configExists: boolean;
  from?: string;
  designMdPath?: string;
  version: string;
};

function cancel(): "cancelled" {
  p.cancel("Setup cancelled — nothing was changed.");
  return "cancelled";
}

export async function promptInitPlan(context: PromptContext): Promise<InitPlan | "cancelled"> {
  process.stdout.write(renderInitHeader(context.version));

  let source: InitPlan["source"];
  let from = context.from;

  if (from === undefined) {
    if (context.configExists) {
      p.log.info(
        `Found ${displayPath(context.cwd, context.configPath)} — keeping your existing config and jumping straight to agent setup.`,
      );
    } else {
      const usage = await p.select({
        message: "What are you setting up?",
        options: [
          {
            value: "author" as const,
            label: "A design system I'm building",
            hint: "Create recontent.config.ts from a starter preset or DTCG tokens",
          },
          {
            value: "consume" as const,
            label: "A design system I consume",
            hint: "Connect coding agents to a published package or recontent.json",
          },
        ],
      });
      if (p.isCancel(usage)) return cancel();

      if (usage === "author") {
        const startFrom = await p.select({
          message: "How would you like to start your tokens?",
          options: [
            ...PRESETS.map((preset) => ({
              value: preset.name,
              label: preset.name,
              hint: preset.description,
            })),
            {
              value: "__dtcg__",
              label: "Import DTCG tokens",
              hint: "Bring your own resolver, token files, or directory",
            },
          ],
        });
        if (p.isCancel(startFrom)) return cancel();

        if (startFrom === "__dtcg__") {
          const dtcgPath = await p.text({
            message: "Where do your DTCG tokens live?",
            placeholder: "tokens/ or design.resolver.json",
            validate: (value) =>
              value && value.trim().length > 0
                ? undefined
                : "Enter a path to a resolver, token file, or directory",
          });
          if (p.isCancel(dtcgPath)) return cancel();
          source = { dtcg: [dtcgPath.trim()] };
        } else {
          source = { preset: startFrom };
        }
      } else {
        const pkg = await p.text({
          message: "Which design system package or snapshot are you using?",
          placeholder: "@acme/design-system or ./recontent.json",
          validate: (value) => {
            const trimmed = value?.trim() ?? "";
            if (trimmed.length === 0) {
              return "Enter an npm package name or a path to recontent.json";
            }
            if (isSnapshotFilePath(trimmed)) {
              try {
                readSnapshot(trimmed, context.cwd);
              } catch (error) {
                return error instanceof Error ? error.message : String(error);
              }
            }
            return undefined;
          },
        });
        if (p.isCancel(pkg)) return cancel();
        from = pkg.trim();
      }
    }
  }

  const transport = await p.select({
    message: "How should coding agents explore your design system?",
    options: [
      {
        value: "cli" as const,
        label: "CLI (recontent inspect)",
        hint: "Recommended — works out of the box, no server config",
      },
      {
        value: "mcp" as const,
        label: "MCP server (recontent mcp)",
        hint: "Tool calls for Claude Code, Cursor, or VS Code",
      },
      {
        value: "skip" as const,
        label: "Skip for now",
        hint: "You can always run `recontent init` again later",
      },
    ],
  });
  if (p.isCancel(transport)) return cancel();

  let agents: InitPlan["agents"];

  if (transport !== "skip") {
    let mcp: McpClient[] | undefined;

    if (transport === "mcp") {
      const selectedClients = await p.multiselect({
        message: "Which editors or agents should we configure for MCP?",
        options: MCP_CLIENT_NAMES.map((client) => ({
          value: client,
          label: MCP_CLIENTS[client].label,
          hint: MCP_CLIENTS[client].path,
        })),
        initialValues: detectMcpClients(context.cwd),
        required: true,
      });
      if (p.isCancel(selectedClients)) return cancel();
      mcp = selectedClients;
    }

    const guidance = await p.multiselect({
      message: "Where should we teach agents how to use it?",
      options: [
        ...SKILL_TARGET_NAMES.map((target) => ({
          value: `skill:${target}` as const,
          label: SKILL_TARGETS[target].label,
          hint: SKILL_TARGETS[target].path,
        })),
        {
          value: "AGENTS.md" as const,
          label: "AGENTS.md",
          hint: "Adds a managed Recontent section",
        },
        {
          value: "CLAUDE.md" as const,
          label: "CLAUDE.md",
          hint: "Adds a managed Recontent section",
        },
      ],
      initialValues: ["skill:agents" as const],
      required: false,
    });
    if (p.isCancel(guidance)) return cancel();

    const skills = SKILL_TARGET_NAMES.filter((target) => guidance.includes(`skill:${target}`));
    const instructions = guidance.filter(
      (item): item is InstructionFile => item === "AGENTS.md" || item === "CLAUDE.md",
    );

    if (skills.length > 0 || (mcp && mcp.length > 0) || instructions.length > 0) {
      agents = {
        mode: transport,
        skills: skills.length > 0 ? skills : undefined,
        mcp,
        instructions: instructions.length > 0 ? instructions : undefined,
        designMdPath: context.designMdPath,
      };
    }
  }

  p.outro("All set — writing your files...");

  return { source, from, agents };
}
