import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { generateSupportingTextSources } from "../shared.js";

export function generateCitationSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  return generateSupportingTextSources("Citation", "cite", tokens);
}
