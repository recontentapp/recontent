#!/usr/bin/env node

import { Command } from "commander";
import { runBuild } from "./commands/build.js";
import { runDoctor } from "./commands/doctor.js";
import { runDtcgExport } from "./commands/dtcg-export.js";
import { runInit } from "./commands/init.js";
import { runHtmlExport } from "./commands/html-export.js";

const program = new Command();

program
  .name("recontent")
  .description("Design token tooling for the recontent package")
  .version("0.0.1");

program
  .command("init")
  .description("Scaffold a recontent.config.ts file with default ref and system design tokens")
  .option("--force", "Overwrite an existing recontent.config.ts")
  .action(async (options: { force?: boolean }) => {
    await runInit({ force: options.force });
  });

program
  .command("html-export")
  .description("Generate an HTML report of all tokens defined in recontent.config.ts")
  .option("-o, --output <file>", "Output file path", "tokens.html")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .action(async (options: { output: string; config: string }) => {
    await runHtmlExport({ output: options.output, config: options.config });
  });

program
  .command("build")
  .description("Generate configured output targets (css, vanilla-extract) from recontent.config.ts")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .option("-w, --watch", "Rerun the build whenever the config file changes")
  .action(async (options: { config: string; watch?: boolean }) => {
    await runBuild({ config: options.config, watch: options.watch });
  });

program
  .command("doctor")
  .description(
    "Validate config, registry, and resolvable dependencies (unknown token values, broken aliases, missing/mismatched runtime dependencies)",
  )
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .action(async (options: { config: string }) => {
    await runDoctor({ config: options.config });
  });

program
  .command("dtcg-export")
  .description("Export tokens to DTCG-compatible .tokens.json files")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .option("-o, --output <dir>", "Output directory for .tokens.json files", ".")
  .action(async (options: { config: string; output: string }) => {
    await runDtcgExport({ config: options.config, output: options.output });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
