import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../../core/logger.js";
import { MissingDesignTokensError } from "../../registry/index.js";
import { runOutput } from "../../outputs/index.js";
import { ensureDependencies } from "../../resolve/ensure-dependencies.js";
import { DEFAULT_CONFIG, loadConfig, resolveConfigPath } from "@recontentapp/core";
import { exitWithError, logSuccess, writeOutputFile } from "../utils/fs.js";

export type BuildOptions = {
  config?: string;
  watch?: boolean;
};

export async function runBuild(options: BuildOptions = {}): Promise<void> {
  if (options.watch) {
    await watchBuild(options);
    return;
  }

  await buildOnce(options, { exitOnError: true });
}

async function watchBuild(options: BuildOptions): Promise<void> {
  const configPath = resolveConfigPath(options.config ?? DEFAULT_CONFIG);

  const safeBuild = async () => {
    try {
      await buildOnce(options, { exitOnError: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
    }
  };

  await safeBuild();
  console.log(`Watching ${configPath} for changes...`);

  let building = false;
  let rerunQueued = false;

  const triggerBuild = () => {
    if (building) {
      rerunQueued = true;
      return;
    }
    building = true;
    safeBuild().finally(() => {
      building = false;
      if (rerunQueued) {
        rerunQueued = false;
        triggerBuild();
      }
    });
  };

  let debounceTimer: NodeJS.Timeout | undefined;
  fs.watch(configPath, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerBuild, 100);
  });

  await new Promise<void>(() => {});
}

async function buildOnce(
  options: BuildOptions,
  { exitOnError }: { exitOnError: boolean },
): Promise<void> {
  const config = await loadConfig(options.config);
  const logger = createLogger(config.logLevel);
  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }
  logger.debug(
    `Loaded build config with ${config.output.length} output target(s), ${config.registry.size} token(s), and ${Object.keys(config.themes).length} theme(s).`,
  );

  const configDir = path.dirname(resolveConfigPath(options.config ?? DEFAULT_CONFIG));
  ensureDependencies(configDir, config.resolve, config.logLevel);

  if (config.output.length === 0) {
    console.log("No output targets configured in recontent.config.ts");
    return;
  }

  for (const output of config.output) {
    let files;
    try {
      files = await runOutput(config, output);
    } catch (error) {
      if (error instanceof MissingDesignTokensError) {
        if (exitOnError) {
          exitWithError(error.message);
        }
        console.error(`Error: ${error.message}`);
        return;
      }
      throw error;
    }

    for (const file of files) {
      const { path: outputPath, written } = await writeOutputFile(
        path.join(output.outDir, file.filename),
        file.content,
        { writeMode: file.writeMode },
      );
      if (written) {
        logSuccess(`Wrote ${outputPath}`);
        logger.debug(`Wrote ${file.content.length.toLocaleString()} bytes to ${outputPath}.`);
      } else {
        logSuccess(`Skipped ${outputPath} (already exists)`);
      }
    }
  }
}
