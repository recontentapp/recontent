import fs from "node:fs";
import path from "node:path";
import { createLogger } from "../../logger.js";
import { MissingDesignTokensError } from "../../registry/index.js";
import { runPlugins } from "../../plugins/runner.js";
import { ensureDependencies } from "../install-dependencies.js";
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
    `Loaded build config with ${config.plugins.length} plugin(s), ${config.registry.size} token(s), and ${Object.keys(config.themes).length} theme(s).`,
  );

  const configDir = path.dirname(resolveConfigPath(options.config ?? DEFAULT_CONFIG));
  ensureDependencies(configDir, config.resolve, config.logLevel);

  if (config.plugins.length === 0) {
    console.log("No plugins configured in recontent.config.ts");
    return;
  }

  const mode = options.watch ? "watch" : "build";
  let result;
  try {
    result = await runPlugins(config, { root: configDir, mode });
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

  for (const diagnostic of result.diagnostics) {
    const prefix = diagnostic.severity === "error" ? "[recontent:error]" : "[recontent:warning]";
    console.error(`${prefix} ${diagnostic.message}`);
  }

  if (result.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    const message = "Build aborted: one or more plugins reported an error.";
    if (exitOnError) {
      exitWithError(message);
    }
    console.error(`Error: ${message}`);
    return;
  }

  for (const file of result.files) {
    const { path: outputPath, written } = await writeOutputFile(file.path, file.content, {
      writeMode: file.writeMode,
    });
    if (written) {
      logSuccess(`Wrote ${outputPath}`);
      logger.debug(`Wrote ${file.content.length.toLocaleString()} bytes to ${outputPath}.`);
    } else {
      logSuccess(`Skipped ${outputPath} (already exists)`);
    }
  }
}
