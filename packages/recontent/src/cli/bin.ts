#!/usr/bin/env node

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
import { formatErrorForReport } from "./utils/exit.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version: string };

const program = new Command();

program
  .name("recontent")
  .description("Design token tooling for the recontent package")
  .version(packageJson.version)
  .option("-c, --config <path>", "Path to config file (default: discovered by searching upward)")
  .option(
    "--cwd <dir>",
    "Directory every relative path in this run is resolved against (default: process cwd)",
  )
  .option(
    "--log-level <level>",
    "info or debug (default: $RECONTENT_LOG_LEVEL, then the config's logLevel)",
  )
  .showHelpAfterError()
  .enablePositionalOptions()
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
    program.error(`error: --log-level must be "info" or "debug", got "${value}"`);
    return undefined;
  }
  return value;
}

/** Resolves the global `--cwd`, `-c/--config`, and `--log-level` options once,
 * before a command's action runs. With `discover: false` (only `init` needs
 * this — it creates the config rather than discovering an existing one),
 * a missing `-c` resolves to `fallback` instead of an upward search. */
function resolveGlobalOptions(
  localConfig?: string,
  { discover = true, fallback }: { discover?: boolean; fallback?: string } = {},
): { cwd: string; configPath: string; logLevel?: LogLevel } {
  const opts = program.opts<GlobalOptions>();
  const cwd = path.resolve(process.cwd(), opts.cwd ?? ".");
  const config = localConfig ?? opts.config;
  const configPath = config
    ? resolveConfigPath(config, { cwd })
    : discover
      ? discoverConfigPath(cwd)
      : resolveConfigPath(fallback!, { cwd });
  const logLevel = resolveLogLevel(opts.logLevel);
  return { cwd, configPath, logLevel };
}

// `-c, --config` is also kept on each command itself (not just as a global
// option before the subcommand name), so `recontent build -c
// recontent.config.ts` — the invocation both playgrounds already use —
// keeps working unchanged.
const CONFIG_OPTION_FLAGS = "-c, --config <path>";
const CONFIG_OPTION_DESC = "Path to config file (default: discovered by searching upward)";

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
  .option(CONFIG_OPTION_FLAGS, "Path to write the config file to (default: recontent.config.ts)")
  .option("--force", "Overwrite an existing recontent.config.ts")
  .option(
    "--from <paths...>",
    "Generate the config from DTCG tokens instead of a preset: a *.resolver.json, *.tokens.json/*.json files, or a directory",
  )
  .action(
    async (
      preset: string | undefined,
      options: { config?: string; force?: boolean; from?: string[] },
    ) => {
      if (!preset && !options.from) {
        program.error("error: missing required argument 'preset' (or pass --from <paths...>)");
      }
      const { cwd, configPath } = resolveGlobalOptions(options.config, {
        discover: false,
        fallback: "recontent.config.ts",
      });
      await runInit({ cwd, configPath, preset, force: options.force, from: options.from });
    },
  );

program
  .command("build")
  .description(
    "Generate configured output targets (css, dtcg, docs, vanilla-extract, typescript, typescript-native, stylex) from recontent.config.ts",
  )
  .option(CONFIG_OPTION_FLAGS, CONFIG_OPTION_DESC)
  .option("-w, --watch", "Rerun the build whenever the config file (or a file it imports) changes")
  .action(async (options: { config?: string; watch?: boolean }) => {
    const { cwd, configPath, logLevel } = resolveGlobalOptions(options.config);
    await runBuild({ cwd, configPath, logLevel, watch: options.watch });
  });

program
  .command("diff [rev]")
  .description(
    "Compare tokens in recontent.config.ts against a previous git revision (default HEAD). " +
      "The revision must be an ancestor of HEAD — diffing loads and executes its config, so an " +
      "unmerged branch or third-party-writable ref is rejected; merge or rebase first.",
  )
  .option(CONFIG_OPTION_FLAGS, CONFIG_OPTION_DESC)
  .option("--fail-on-breaking", "Exit with code 1 when tokens are removed, renamed, or retyped")
  .addOption(
    new Option("--format <format>", "Output format").choices(DIFF_FORMATS).default("markdown"),
  )
  .action(
    async (
      rev: string | undefined,
      options: { config?: string; failOnBreaking?: boolean; format: DiffFormat },
    ) => {
      const { cwd, configPath, logLevel } = resolveGlobalOptions(options.config);
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
  console.error(formatErrorForReport(error, debug));
}

// Codes commander uses for its own help/version/usage-error paths. Anything
// else that reaches `error()`/`_exit()` is a usage problem too (unknown
// option/command, missing argument, ...) and gets the same exit(2) contract.
const NON_USAGE_ERROR_CODES = new Set([
  "commander.help",
  "commander.helpDisplayed",
  "commander.version",
  "commander.executeSubCommandAsync",
]);

process.on("unhandledRejection", (error: unknown) => {
  reportFatalError(error);
  process.exitCode = 1;
});

program.parseAsync(process.argv).catch((error: unknown) => {
  if (error instanceof CommanderError) {
    if (NON_USAGE_ERROR_CODES.has(error.code)) {
      process.exitCode = error.exitCode;
      return;
    }
    // Usage error (unknown command/option, missing/invalid argument, ...).
    // Commander already wrote the message (and help, via
    // showHelpAfterError()) to stderr before throwing; just set the
    // exit(2) contract on top of whatever exitCode it picked.
    process.exitCode = 2;
    return;
  }
  reportFatalError(error);
  process.exitCode = 1;
});
