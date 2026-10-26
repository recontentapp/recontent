#!/usr/bin/env node

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { Argument, Command, CommanderError, Option } from "commander";
import type { LogLevel } from "@recontentapp/core";
import { discoverConfigPath, resolveConfigPath } from "@recontentapp/core";
import { runBuild } from "./commands/build.js";
import { runDiff } from "./commands/diff.js";
import { DIFF_FORMATS, type DiffFormat } from "./diff/diff.js";
import { runInit } from "./commands/init.js";
import { runInspect, type InspectTarget } from "./commands/inspect/index.js";
import { FORMATS, type Format } from "./commands/inspect/render.js";
import { PRESETS, PRESET_NAMES } from "./presets/index.js";
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
  .option(
    "--log-level <level>",
    "info or debug (default: $RECONTENT_LOG_LEVEL, then the config's logLevel)",
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
  const cwd = path.resolve(process.cwd(), opts.cwd ?? ".");
  if (!fs.statSync(cwd, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(`--cwd: directory not found: "${cwd}".`);
  }
  const configPath = opts.config
    ? resolveConfigPath(opts.config, { cwd })
    : discover
      ? discoverConfigPath(cwd)
      : resolveConfigPath(fallback!, { cwd });
  const logLevel = resolveLogLevel(opts.logLevel);
  return { cwd, configPath, logLevel };
}

program
  .command("init")
  .description("Scaffold a recontent.config.ts from a design-system preset")
  .addArgument(
    new Argument("[preset]", "Design system preset to start from (omit with --from)").choices(
      PRESET_NAMES,
    ),
  )
  .addHelpText(
    "after",
    `\nPresets:\n${PRESETS.map((preset) => `  ${preset.name.padEnd(16)}${preset.description}`).join("\n")}`,
  )
  .option("--force", "Overwrite an existing config file")
  .option(
    "--from <path>",
    "Generate the config from DTCG tokens instead of a preset: a *.resolver.json, a *.tokens.json/*.json file, or a directory (repeatable)",
    (file: string, previous: string[] = []) => [...previous, file],
  )
  .action(async (preset: string | undefined, options: { force?: boolean; from?: string[] }) => {
    if (preset && options.from) {
      return program.error("error: the preset argument and --from are mutually exclusive");
    }
    const source = options.from ? { from: options.from } : preset ? { preset } : undefined;
    if (!source) {
      return program.error("error: missing required argument 'preset' (or pass --from <path>)");
    }
    const { cwd, configPath } = resolveGlobalOptions({
      discover: false,
      fallback: "recontent.config.ts",
    });
    await runInit({ cwd, configPath, force: options.force, source });
  });

const NO_CACHE_HELP =
  "Neither read nor write the component introspection cache (a file in .recontent/ next to " +
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
  .option("--no-cache", NO_CACHE_HELP)
  .action(async (options: { watch?: boolean; cache: boolean }) => {
    const { cwd, configPath, logLevel } = resolveGlobalOptions();
    await runBuild({
      cwd,
      configPath,
      logLevel,
      watch: options.watch,
      cache: cacheOption(options),
    });
  });

program
  .command("diff [rev]")
  .description("Compare the config's tokens against a previous git revision (default HEAD)")
  .addHelpText(
    "after",
    "\nThe revision must be an ancestor of HEAD: diffing loads and executes its config, so an " +
      "unmerged branch or third-party-writable ref is rejected. Merge or rebase first.",
  )
  .option(
    "--fail-on-breaking",
    "Exit with code 1 when tokens, themes or theme overrides are removed, or tokens are renamed or retyped",
  )
  .addOption(
    new Option("--format <format>", "Output format").choices(DIFF_FORMATS).default("markdown"),
  )
  .action(
    async (rev: string | undefined, options: { failOnBreaking?: boolean; format: DiffFormat }) => {
      const { cwd, configPath, logLevel } = resolveGlobalOptions();
      await runDiff({
        cwd,
        configPath,
        logLevel,
        rev,
        failOnBreaking: options.failOnBreaking,
        format: options.format,
      });
    },
  );

const inspect = program
  .command("inspect")
  .description("Show what the config defines: tokens and components")
  .addHelpText(
    "after",
    `
Start with \`recontent inspect\` for an overview, then drill down:
  recontent inspect tokens [path...]       groups with counts; a path shows one token or everything under it
  recontent inspect components [name...]   one line per component; a name shows its props in full

Output is markdown by default. --format json returns full detail for the whole selection
(never a summary) under { schemaVersion, kind, ... }, with data on stdout and logs on stderr.
An unknown path, name, type or theme exits 2 and suggests the closest matches; with --format json
the errors are also printed on stdout as { schemaVersion, kind: "error", errors }. Exit 1 is for a
broken project.`,
  );

function inspectOptions(command: Command): { format: Format; cache: boolean } {
  return command.optsWithGlobals<{ format: Format; cache: boolean }>();
}

async function runInspectTarget(
  target: InspectTarget,
  options: { format: Format; cache: boolean },
): Promise<void> {
  const { cwd, configPath, logLevel } = resolveGlobalOptions();
  await runInspect({
    cwd,
    configPath,
    logLevel,
    format: options.format,
    target,
    cache: cacheOption(options),
  });
}

// Defined once here: commander lets a parent's options appear after its subcommand, so
// `inspect tokens --format json` works, and subcommands read it back from their parent.
inspect
  .addOption(new Option("--format <format>", "Output format").choices(FORMATS).default("markdown"))
  .option("--no-cache", NO_CACHE_HELP)
  .action(async (options: { format: Format; cache: boolean }) => {
    await runInspectTarget({ kind: "overview" }, options);
  });

inspect
  .command("tokens [path...]")
  .description("List token groups, or the tokens at or under the given dotted paths")
  .option("--type <type>", "Only tokens of this type (e.g. color)")
  .option("--theme <theme>", "Show values for this theme only")
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
  .action(async (names: string[], options: { deprecated?: boolean }, command: Command) => {
    await runInspectTarget(
      { kind: "components", names, deprecated: options.deprecated },
      inspectOptions(command),
    );
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
