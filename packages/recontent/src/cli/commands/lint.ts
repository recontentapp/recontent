import { createLogger } from "../../core/logger.js";
import { loadConfig } from "@recontentapp/core";

export type LintOptions = {
  config?: string;
};

export async function runLint(options: LintOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const logger = createLogger(config.logLevel);

  for (const diagnostic of config.diagnostics) {
    logger.warn(diagnostic.message);
  }
}
