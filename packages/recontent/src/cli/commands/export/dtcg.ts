import path from "node:path";
import { generateDtcgJson, generateDtcgThemedJson } from "../../../generators/dtcg.js";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { createLogger } from "../../../logger.js";
import { writeOutputFile } from "../../utils/fs.js";

export type DtcgExportOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  output: string;
};

export async function runDtcgExport(options: DtcgExportOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const logger = createLogger(options.logLevel ?? config.logLevel);
  const written: string[] = [];

  const { path: basePath } = await writeOutputFile(
    path.join(options.output, "tokens.tokens.json"),
    generateDtcgJson(config),
    options.cwd,
  );
  written.push(basePath);

  for (const themeName of Object.keys(config.themes).sort()) {
    const { path: themePath } = await writeOutputFile(
      path.join(options.output, `${themeName}.tokens.json`),
      generateDtcgThemedJson(config, themeName),
      options.cwd,
    );
    written.push(themePath);
  }

  for (const filePath of written) {
    logger.info(`Wrote ${filePath}`);
  }
}
