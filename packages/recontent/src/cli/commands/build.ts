import path from "node:path";
import { createLogger } from "../../core/logger.js";
import { MissingDesignTokensError } from "../../registry/index.js";
import { runOutput } from "../../outputs/index.js";
import { loadConfig } from "@recontentapp/core";
import { exitWithError, logSuccess, writeOutputFile } from "../utils/fs.js";

export type BuildOptions = {
  config?: string;
};

export async function runBuild(options: BuildOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const logger = createLogger(config.logLevel);
  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }
  logger.debug(
    `Loaded build config with ${config.output.length} output target(s), ${config.registry.size} token(s), and ${Object.keys(config.themes).length} theme(s).`,
  );

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
        exitWithError(error.message);
      }
      throw error;
    }

    for (const file of files) {
      const outputPath = await writeOutputFile(
        path.join(output.outDir, file.filename),
        file.content,
      );
      logSuccess(`Wrote ${outputPath}`);
      logger.debug(`Wrote ${file.content.length.toLocaleString()} bytes to ${outputPath}.`);
    }
  }
}
