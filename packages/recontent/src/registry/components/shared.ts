import { componentArtifactPath } from "../paths.js";
import type { ComponentOutput, ComponentSourceFiles, ScaleImport } from "../types.js";

export function vanillaExtractComponentOutput(
  id: string,
  name: string,
  generateSources: (scales: Record<string, ScaleImport>) => ComponentSourceFiles,
): ComponentOutput {
  return {
    runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
    generate: ({ scales }) => {
      const sources = generateSources(scales);
      return [
        {
          filename: componentArtifactPath(id, name, ".gen.css.ts"),
          content: sources.styles,
        },
        {
          filename: componentArtifactPath(id, name, ".gen.tsx"),
          content: sources.component,
        },
      ];
    },
  };
}
