#!/usr/bin/env node

import { Command } from "commander";
import { runBuild } from "./commands/build.js";
import { runFigmaExport } from "./commands/figma-export.js";
import { runInit } from "./commands/init.js";
import { runLint } from "./commands/lint.js";
import { runVisualize } from "./commands/visualize.js";

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
  .command("visualize")
  .description("Generate an HTML report of all tokens defined in recontent.config.ts")
  .option("-o, --output <file>", "Output file path", "tokens.html")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .action(async (options: { output: string; config: string }) => {
    await runVisualize({ output: options.output, config: options.config });
  });

program
  .command("build")
  .description("Generate configured output targets (css, vanilla-extract) from recontent.config.ts")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .action(async (options: { config: string }) => {
    await runBuild({ config: options.config });
  });

program
  .command("lint")
  .description("Warn about unknown or anonymous token values")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .action(async (options: { config: string }) => {
    await runLint({ config: options.config });
  });

program
  .command("figma-export")
  .description("Export tokens to DTCG-Figma compatible .tokens.json files")
  .option("-c, --config <path>", "Path to config file", "recontent.config.ts")
  .option("-o, --output <dir>", "Output directory for .tokens.json files", ".")
  .action(async (options: { config: string; output: string }) => {
    await runFigmaExport({ config: options.config, output: options.output });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
