import { generateHtmlReport } from "../../../generators/html.js";
import { loadConfig, type LogLevel } from "@recontentapp/core";
import { logSuccess } from "../../utils/exit.js";
import { writeOutputFile } from "../../utils/fs.js";

export type HtmlExportOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  output: string;
};

export async function runHtmlExport(options: HtmlExportOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const html = generateHtmlReport(config);
  const { path: outputPath } = await writeOutputFile(options.output, html, options.cwd);
  logSuccess(`Wrote token report to ${outputPath}`);
}
