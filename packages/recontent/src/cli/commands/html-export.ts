import { generateHtmlReport } from "../../generators/html.js";
import { loadConfig } from "@recontentapp/core";
import { logSuccess, writeOutputFile } from "../utils/fs.js";

export type HtmlExportOptions = {
  output?: string;
  config?: string;
};

export async function runHtmlExport(options: HtmlExportOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const html = generateHtmlReport(config);
  const { path: outputPath } = await writeOutputFile(options.output ?? "tokens.html", html);
  logSuccess(`Wrote token report to ${outputPath}`);
}
