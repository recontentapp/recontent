import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { generateSupportingTextSources } from "../shared.js";

export function generateTimestampSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  return generateSupportingTextSources("Timestamp", "time", tokens);
}
