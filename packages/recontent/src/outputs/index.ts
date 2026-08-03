import type { Config, Output, OutputFile, OutputTarget } from "@recontentapp/core";
import { createLogger } from "../core/logger.js";
import { cssOutputProcessor } from "./css.js";
import { vanillaExtractOutputProcessor } from "./vanilla-extract.js";
import { typescriptOutputProcessor } from "./typescript.js";
import { typescriptNativeOutputProcessor } from "./typescript-native.js";

export type {
  Output,
  OutputFile,
  TypeScriptNativeOutput,
  TypeScriptOutput,
  VanillaExtractOutput,
} from "@recontentapp/core";

export interface OutputProcessor<T extends Output = Output> {
  target: T["target"];
  generate(config: Config, output: T): OutputFile[] | Promise<OutputFile[]>;
}

const outputProcessors: Record<OutputTarget, OutputProcessor> = {
  css: cssOutputProcessor,
  "vanilla-extract": vanillaExtractOutputProcessor,
  typescript: typescriptOutputProcessor,
  "typescript-native": typescriptNativeOutputProcessor,
};

function getOutputProcessor(target: OutputTarget): OutputProcessor {
  const processor = outputProcessors[target];
  if (!processor) {
    throw new Error(`Unknown output target: ${target}`);
  }
  return processor;
}

export async function runOutput(config: Config, output: Output): Promise<OutputFile[]> {
  const logger = createLogger(config.logLevel);
  const processor = getOutputProcessor(output.target);
  logger.debug(
    `Generating ${output.target} output in ${output.outDir} from ${config.registry.size} token(s) and ${Object.keys(config.themes).length} theme(s).`,
  );
  const files = await processor.generate(config, output);
  logger.debug(
    `Generated ${files.length} ${output.target} file(s): ${files.map((file) => file.filename).join(", ") || "(none)"}.`,
  );
  return files;
}
