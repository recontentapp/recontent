import { generateDtcgJson, generateDtcgThemedJson } from "../../core/generators/dtcg.js";
import { loadConfig } from "@recontentapp/core";
import { logSuccess, writeOutputFile } from "../utils/fs.js";

export type FigmaExportOptions = {
  config?: string;
};

export async function runFigmaExport(options: FigmaExportOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const written: string[] = [];

  const basePath = await writeOutputFile("tokens.tokens.json", generateDtcgJson(config));
  written.push(basePath);

  for (const themeName of Object.keys(config.themes).sort()) {
    const themePath = await writeOutputFile(
      `${themeName}.tokens.json`,
      generateDtcgThemedJson(config, themeName),
    );
    written.push(themePath);
  }

  for (const filePath of written) {
    logSuccess(`Wrote ${filePath}`);
  }
}
