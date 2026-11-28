import fs from "node:fs";
import os from "node:os";
import { createRequire } from "node:module";
import path from "node:path";
import { Command, CommanderError, Option } from "commander";
import type { LogLevel } from "../logger.js";
import { ConfigLoadError, discoverConfigPath, resolveConfigPath } from "../config/load.js";
import { isSnapshotFilePath, readSnapshot } from "../snapshot/snapshot.js";
import { runBuild } from "./commands/build.js";
import { runDiff } from "./commands/diff/index.js";
import { DIFF_FORMATS, formatDiffError, type DiffFormat } from "./commands/diff/format.js";
import { runInit, type InitOptions } from "./commands/init/index.js";
import type { InstructionFile, McpClient, SkillTarget } from "./commands/init/agents/index.js";
import { parseMcpClients } from "./commands/init/agents/mcp.js";
import { parseSkillTargets } from "./commands/init/agents/skill.js";
import { promptInitPlan } from "./commands/init/prompts.js";
import { runInspect, type InspectTarget } from "./commands/inspect/index.js";
import { runMcp } from "./commands/mcp/index.js";
import { FORMATS, renderErrors, type Format } from "./commands/inspect/render.js";
import { PRESETS, PRESET_NAMES } from "./commands/init/presets/index.js";
import { reportError } from "./utils/exit.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version: string };

const program = new Command();

program
  .name("recontent")
  .description(
    "Define design tokens once in recontent.config.ts, then generate the outputs your project consumes (CSS, DTCG, docs, ...) with plugins.",
  )
  .version(packageJson.version)
  .option(
    "-c, --config <path>",
    "Path to the config file (default: discovered by searching upward; init writes it here, default recontent.config.ts)",
  )
  .option(
    "--cwd <dir>",
    "Directory every relative path in this run is resolved against (default: process cwd)",
  )
  .addOption(
    new Option(
      "--log-level <level>",
      "info or debug (default: $RECONTENT_LOG_LEVEL, then the config's logLevel)",
    ).choices(["info", "debug"]),
  )
  .showHelpAfterError("(run with --help for usage)")
  .configureHelp({ showGlobalOptions: true })
  .exitOverride();

type GlobalOptions = {
  config?: string;
  cwd?: string;
  logLevel?: string;
};

function resolveLogLevel(explicit: string | undefined): LogLevel | undefined {
  const value = explicit ?? process.env.RECONTENT_LOG_LEVEL;
  if (value === undefined) return undefined;
  if (value !== "info" && value !== "debug") {
    const source = explicit === undefined ? "$RECONTENT_LOG_LEVEL" : "--log-level";
    program.error(`error: ${source} must be "info" or "debug", got "${value}"`);
    return undefined;
  }
  return value;
}

function expandHome(input: string): string {
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

/** Resolves the global `--cwd` and `--log-level` options. */
function resolveCwdAndLogLevel(): { cwd: string; logLevel?: LogLevel } {
  const opts = program.opts<GlobalOptions>();
  const cwd = path.resolve(process.cwd(), expandHome(opts.cwd ?? "."));
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`--cwd: directory not found: "${cwd}".`);
  }
  return { cwd, logLevel: resolveLogLevel(opts.logLevel) };
}

/** Resolves the global `--cwd`, `-c/--config`, and `--log-level` options once,
 * before a command's action runs. With `discover: false` (only `init` needs
 * this — it creates the config rather than discovering an existing one),
 * a missing `-c` resolves to `fallback` instead of an upward search. */
function resolveGlobalOptions({
  discover = true,
  fallback,
}: { discover?: boolean; fallback?: string } = {}): {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
} {
  const opts = program.opts<GlobalOptions>();
  const { cwd, logLevel } = resolveCwdAndLogLevel();
  const configPath = opts.config
    ? resolveConfigPath(opts.config, { cwd })
    : discover
      ? discoverConfigPath(cwd)
      : resolveConfigPath(fallback!, { cwd });
  return { cwd, configPath, logLevel };
}

type InitCliOptions = {
  preset?: string;
  dtcg?: string[];
  force?: boolean;
  from?: string;
  skill?: boolean | string;
  mcp?: string[];
  agentsMd?: boolean;
  claudeMd?: boolean;
  designMd?: string;
  yes?: boolean;
};

program
  .command("init")
  .description("Scaffold a recontent.config.ts and configure coding agents for your design system")
  .addOption(
    new Option("--preset <name>", "Design system preset to start from").choices(PRESET_NAMES),
  )
  .option(
    "--dtcg <path>",
    "Generate the config from DTCG tokens instead of a preset: a *.resolver.json, a *.tokens.json/*.json file, or a directory (repeatable)",
    (file: string, previous: string[] = []) => [...previous, file],
  )
  .option("--force", "Overwrite an existing config file")
  .option(
    "--from <package|file>",
    "Configure agent integrations for a published design system snapshot",
  )
  .option(
    "--skill [target]",
    "Write a project-local Agent Skill (agents, claude, or all; comma-separated; default: agents)",
  )
  .option(
    "--mcp <client>",
    "Configure MCP server for a client (claude, cursor, vscode, or all; repeatable or comma-separated)",
    (client: string, previous: string[] = []) => [...previous, client],
  )
  .option("--agents-md", "Add or update the Recontent section in AGENTS.md")
  .option("--claude-md", "Add or update the Recontent section in CLAUDE.md")
  .option(
    "--design-md <path>",
    "Path to DESIGN.md referenced by generated agent files (auto-detected if omitted)",
  )
  .option("-y, --yes", "Skip interactive prompts and accept defaults")
  .addHelpText(
    "after",
    `\nPresets:\n${PRESETS.map((preset) => `  ${preset.name.padEnd(16)}${preset.description}`).join("\n")}`,
  )
  .action(async (options: InitCliOptions) => {
    if (options.preset && options.dtcg) {
      return program.error("error: --preset and --dtcg are mutually exclusive");
    }
    if (options.from !== undefined && (options.preset || options.dtcg)) {
      return program.error("error: --from cannot be used with --preset or --dtcg");
    }
    if (options.from !== undefined && program.opts<GlobalOptions>().config !== undefined) {
      return program.error(
        "error: option '--from <package|file>' cannot be used with option '-c, --config <path>'",
      );
    }

    let skillTargets: SkillTarget[] | undefined;
    if (options.skill !== undefined) {
      try {
        skillTargets = parseSkillTargets(options.skill);
      } catch (error) {
        return program.error(`error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    let mcpClients: McpClient[] | undefined;
    if (options.mcp) {
      try {
        mcpClients = parseMcpClients(options.mcp);
      } catch (error) {
        return program.error(`error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const instructions: InstructionFile[] = [];
    if (options.agentsMd) instructions.push("AGENTS.md");
    if (options.claudeMd) instructions.push("CLAUDE.md");

    const hasSourceFlag = Boolean(options.preset || options.dtcg);
    const hasAgentFlag = Boolean(skillTargets?.length || mcpClients?.length || instructions.length);
    const hasActionFlag = hasSourceFlag || hasAgentFlag;

    const { cwd, configPath, logLevel } = resolveGlobalOptions({
      discover: false,
      fallback: "recontent.config.ts",
    });

    if (!hasActionFlag && !options.yes) {
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        return program.error(
          "error: interactive init requires a TTY. Pass flags instead (e.g. --preset neutral, --dtcg <path>, --from <pkg>, --skill, --mcp <client>, or -y).",
        );
      }

      if (options.from !== undefined && isSnapshotFilePath(options.from)) {
        readSnapshot(options.from, cwd);
      }

      const plan = await promptInitPlan({
        cwd,
        configPath,
        configExists: fs.existsSync(configPath),
        from: options.from,
        designMdPath: options.designMd,
        version: packageJson.version,
      });
      if (plan === "cancelled") return;

      await runInit({ cwd, configPath, logLevel, force: options.force, ...plan });
      return;
    }

    let source: InitOptions["source"] = options.dtcg
      ? { dtcg: options.dtcg }
      : options.preset
        ? { preset: options.preset }
        : undefined;

    let agents: InitOptions["agents"];
    if (hasAgentFlag) {
      agents = {
        mode: mcpClients && mcpClients.length > 0 ? "mcp" : "cli",
        skills: skillTargets,
        mcp: mcpClients,
        instructions: instructions.length > 0 ? instructions : undefined,
        designMdPath: options.designMd,
      };
    }

    if (options.yes) {
      if (!source && options.from === undefined && !fs.existsSync(configPath)) {
        source = { preset: "neutral" };
      }
      if (!agents) {
        agents = {
          mode: "cli",
          skills: ["agents"],
          designMdPath: options.designMd,
        };
      }
    }

    await runInit({
      cwd,
      configPath,
      logLevel,
      force: options.force,
      source,
      from: options.from,
      agents,
    });
  });

const NO_CACHE_HELP =
  "Neither read nor write the introspection cache (a file in .recontent/ next to " +
  "the config). The cache goes stale when a new file changes how an import resolves outside the " +
  "directories of the project's own files; use this flag then, in CI, or to debug introspection";

/** Introspection results are cached unless `--no-cache`; the version invalidates them across upgrades. */
function cacheOption(options: { cache: boolean }): { version: string } | undefined {
  return options.cache ? { version: packageJson.version } : undefined;
}

program
  .command("build")
  .description("Run the plugins configured in the config file to generate their output")
  .option("-w, --watch", "Rerun the build whenever the config file (or a file it imports) changes")
  .addOption(
    new Option(
      "--check",
      "Write nothing; exit 1 if any generated file is missing or differs from what the build would write",
    ).conflicts("watch"),
  )
  .option("--no-cache", NO_CACHE_HELP)
  .action(async (options: { watch?: boolean; check?: boolean; cache: boolean }) => {
    const { cwd, configPath, logLevel } = resolveGlobalOptions();
    await runBuild({
      cwd,
      configPath,
      logLevel,
      watch: options.watch,
      check: options.check,
      cache: cacheOption(options),
    });
  });

program
  .command("diff [rev]")
  .description(
    "Compare the config's tokens and, when introspection is configured, components and types against a previous git revision (default HEAD)",
  )
  .addHelpText(
    "after",
    "\nThe revision must be an ancestor of HEAD: diffing loads and executes its config, so an " +
      "unmerged branch or third-party-writable ref is rejected. Merge or rebase first.",
  )
  .option(
    "--fail-on-breaking",
    "Exit with code 1 on a breaking change: tokens or themes removed, tokens renamed or retyped, components or types removed, props removed, made required or narrowed",
  )
  .addOption(
    new Option("--format <format>", "Output format").choices(DIFF_FORMATS).default("markdown"),
  )
  .option("--no-cache", NO_CACHE_HELP)
  .action(
    async (
      rev: string | undefined,
      options: { failOnBreaking?: boolean; format: DiffFormat; cache: boolean },
    ) => {
      let globals: ReturnType<typeof resolveGlobalOptions>;
      try {
        globals = resolveGlobalOptions();
      } catch (error) {
        if (options.format !== "json") throw error;
        reportFatalError(error);
        console.log(formatDiffError(error instanceof Error ? error.message : String(error)));
        process.exitCode = 1;
        return;
      }
      const { cwd, configPath, logLevel } = globals;
      await runDiff({
        cwd,
        configPath,
        logLevel,
        rev,
        failOnBreaking: options.failOnBreaking,
        format: options.format,
        cache: cacheOption(options),
      });
    },
  );

const inspect = program
  .command("inspect")
  .description("Show what the config defines: tokens, components and their types")
  .addHelpText(
    "after",
    `
Start with \`recontent inspect\` for an overview, then drill down:
  recontent inspect tokens [path...]       groups with counts; a path shows one token or everything under it
  recontent inspect components [name...]   one line per component; a name shows its import, props and the
                                           types they reference, long lists shortened and props shared with
                                           other components summarized. --props <name...> shows those props in full
  recontent inspect types [name...]        one line per project type; a name shows its members or values
  recontent inspect search <query...>      tokens, components and types whose names, descriptions, usage notes
                                           or values contain any query (a color, a CSS variable, "tooltip")

Output is markdown by default. --format json returns full detail for the whole selection
(never a summary) under { schemaVersion, kind, ... }, with data on stdout and logs on stderr.
Without a config, browse a design system installed as a dependency: --from <package|file> reads the
snapshot its maintainers publish with the inspect() plugin (a package's package.json "recontent" field,
or a path to a recontent.json). It replaces -c/--config and --no-cache, and works with every command above.

An unknown path, name, type or theme exits 2 and suggests the closest matches; with --format json
the errors are also printed on stdout as { schemaVersion, kind: "error", errors }. Exit 1 is for a
broken project.`,
  );

type InspectCliOptions = { format: Format; cache: boolean; from?: string };

function inspectOptions(command: Command): InspectCliOptions {
  return command.optsWithGlobals<InspectCliOptions>();
}

type Source = { cwd: string; logLevel?: LogLevel } & ({ from: string } | { configPath: string });

/** Where `inspect` and `mcp` read the design system: a published snapshot, or the discovered config. */
function resolveSource(from: string | undefined): Source {
  if (from !== undefined) {
    if (program.opts<GlobalOptions>().config !== undefined) {
      return program.error(
        "error: option '--from <package|file>' cannot be used with option '-c, --config <path>'",
      );
    }
    // No config to discover: the snapshot stands in for it.
    return { ...resolveCwdAndLogLevel(), from };
  }
  try {
    return resolveGlobalOptions();
  } catch (error) {
    throw error instanceof ConfigLoadError
      ? new Error(
          `${error.message}\nTo browse an installed design system instead, pass --from <package|file>.`,
          { cause: error },
        )
      : error;
  }
}

async function runInspectTarget(target: InspectTarget, options: InspectCliOptions): Promise<void> {
  let source: Source;
  try {
    source = resolveSource(options.from);
  } catch (error) {
    if (options.format !== "json" || error instanceof CommanderError) throw error;
    reportFatalError(error);
    process.stdout.write(
      `${renderErrors([{ message: error instanceof Error ? error.message : String(error) }])}\n`,
    );
    process.exitCode = 1;
    return;
  }
  await runInspect({
    ...source,
    format: options.format,
    target,
    ...("from" in source ? {} : { cache: cacheOption(options) }),
  });
}

// Defined once here: commander lets a parent's options appear after its subcommand, so
// `inspect tokens --format json` works, and subcommands read it back from their parent.
inspect
  .addOption(new Option("--format <format>", "Output format").choices(FORMATS).default("markdown"))
  .addOption(
    new Option(
      "--from <package|file>",
      "Inspect a design system's published snapshot (a package name, or a path to recontent.json) instead of a config",
    ).conflicts("cache"),
  )
  .option("--no-cache", NO_CACHE_HELP)
  .action(async (options: InspectCliOptions) => {
    await runInspectTarget({ kind: "overview" }, options);
  });

inspect
  .command("tokens [path...]")
  .description("List token groups, or the tokens at or under the given dotted paths")
  .option("--type <type>", "Only tokens of this type (e.g. color)")
  .option(
    "--theme <theme>",
    "Show values for this theme or axis selection only (e.g. dark or brand=acme,mode=dark)",
  )
  .option("--deprecated", "Only deprecated tokens")
  .action(
    async (
      paths: string[],
      options: { type?: string; theme?: string; deprecated?: boolean },
      command: Command,
    ) => {
      await runInspectTarget({ kind: "tokens", paths, ...options }, inspectOptions(command));
    },
  );

inspect
  .command("components [name...]")
  .description(
    "List components, or the props of the given components (Tabs also matches Tabs.Item)",
  )
  .option("--deprecated", "Only deprecated components")
  .option("--props <names...>", "Only these props, shown in full without shortening")
  .action(
    async (
      names: string[],
      options: { deprecated?: boolean; props?: string[] },
      command: Command,
    ) => {
      await runInspectTarget(
        { kind: "components", names, deprecated: options.deprecated, props: options.props },
        inspectOptions(command),
      );
    },
  );

inspect
  .command("types [name...]")
  .description("List the project types that components reference, or the given types in full")
  .option("--deprecated", "Only deprecated types")
  .action(async (names: string[], options: { deprecated?: boolean }, command: Command) => {
    await runInspectTarget(
      { kind: "types", names, deprecated: options.deprecated },
      inspectOptions(command),
    );
  });

inspect
  .command("search <query...>")
  .description(
    "Find tokens, components and types whose names, descriptions, usage notes or values contain any of the queries",
  )
  .action(async (queries: string[], _options: object, command: Command) => {
    await runInspectTarget({ kind: "search", queries }, inspectOptions(command));
  });

program
  .command("mcp")
  .description(
    "Start a stdio MCP server exposing the design system to coding agents (tokens, components and types)",
  )
  .addOption(
    new Option(
      "--from <package|file>",
      "Serve a design system's published snapshot (a package name, or a path to recontent.json) instead of a config",
    ).conflicts("cache"),
  )
  .option("--no-cache", NO_CACHE_HELP)
  .addHelpText(
    "after",
    `
Communicates over JSON-RPC 2.0 on stdin/stdout; all logs go to stderr.
Exposes read-only tools for browsing the overview, tokens, components, types, and search.
Changes to the config, its imports, the components or the snapshot are picked up without a restart.

Examples:
  recontent mcp                     Serve the local recontent.config.ts
  recontent mcp --from @acme/ds     Serve an installed package's published snapshot`,
  )
  .action(async (options: { from?: string; cache: boolean }) => {
    const source = resolveSource(options.from);
    await runMcp({
      ...source,
      version: packageJson.version,
      ...("from" in source ? {} : { cache: cacheOption(options) }),
    });
  });

function reportFatalError(error: unknown): void {
  let debug = false;
  try {
    debug = resolveLogLevel(program.opts<GlobalOptions>().logLevel) === "debug";
  } catch {
    // Options not parsed yet (error happened during parsing itself).
  }
  reportError(error, debug);
}

process.on("unhandledRejection", (error: unknown) => {
  reportFatalError(error);
  process.exitCode = 1;
});

// A bare `recontent` behaves like `recontent --help`: help on stdout, exit 0.
const argv = process.argv.length > 2 ? process.argv : [...process.argv, "--help"];

program.parseAsync(argv).catch((error: unknown) => {
  if (error instanceof CommanderError) {
    // Commander already wrote the message (or help/version output) to the
    // right stream; its exit code is 0 for help/version and 1 for usage errors.
    process.exitCode = error.exitCode;
    return;
  }
  reportFatalError(error);
  process.exitCode = 1;
});
