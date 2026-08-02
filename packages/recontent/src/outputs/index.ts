import type { Config, Output, OutputFile, OutputTarget } from "@recontentapp/core";
import { createLogger } from "../core/logger.js";
import { cssOutputProcessor } from "./css.js";
import { vanillaExtractOutputProcessor } from "./vanilla-extract.js";
import { typescriptOutputProcessor } from "./typescript.js";
import { typescriptNativeOutputProcessor } from "./typescript-native.js";

/**
 * A scale from any token layer. `never` deliberately avoids an index signature:
 * a scale's `_kind` and other metadata would otherwise be required to satisfy
 * the token-leaf value type for arbitrary string keys.
 */
export type {
  BuiltInComponentOptions,
  ScaleBinding,
  TokenBinding,
} from "../registry/built-in-components.js";

export type {
  CssOutput,
  Output,
  OutputFile,
  OutputTarget,
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

export function getOutputProcessor(target: OutputTarget): OutputProcessor {
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
