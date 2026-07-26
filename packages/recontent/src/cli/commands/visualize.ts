import { generateHtmlReport } from "../../core/generators/html.js";
import { loadConfig } from "@recontentapp/core";
import { logSuccess, writeOutputFile } from "../utils/fs.js";

export type VisualizeOptions = {
  output?: string;
  config?: string;
};

export async function runVisualize(options: VisualizeOptions = {}): Promise<void> {
  const config = await loadConfig(options.config);
  const html = generateHtmlReport(config);
  const outputPath = await writeOutputFile(options.output ?? "tokens.html", html);
  logSuccess(`Wrote token report to ${outputPath}`);
}
