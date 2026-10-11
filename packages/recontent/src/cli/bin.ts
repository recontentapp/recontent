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

program
  .command("build")
  .description("Run the plugins configured in the config file to generate their output")
  .option("-w, --watch", "Rerun the build whenever the config file (or a file it imports) changes")
  .action(async (options: { watch?: boolean }) => {
    const { cwd, configPath, logLevel } = resolveGlobalOptions();
    await runBuild({ cwd, configPath, logLevel, watch: options.watch });
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
