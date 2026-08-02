import path from "node:path";
import { generateDtcgJson, generateDtcgThemedJson } from "../../core/generators/dtcg.js";
import { loadConfig } from "@recontentapp/core";
import { logSuccess, writeOutputFile } from "../utils/fs.js";

export type DtcgExportOptions = {
  config?: string;
  output?: string;
};

export async function runDtcgExport(options: DtcgExportOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const outputDir = options.output ?? ".";
  const written: string[] = [];

  const basePath = await writeOutputFile(
    path.join(outputDir, "tokens.tokens.json"),
    generateDtcgJson(config),
  );
  written.push(basePath);

  for (const themeName of Object.keys(config.themes).sort()) {
    const themePath = await writeOutputFile(
      path.join(outputDir, `${themeName}.tokens.json`),
      generateDtcgThemedJson(config, themeName),
    );
    written.push(themePath);
  }

  for (const filePath of written) {
    logSuccess(`Wrote ${filePath}`);
  }
}
