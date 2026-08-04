import { componentArtifactPath } from "../paths.js";
import type {
  BreakpointBinding,
  ComponentOutput,
  ComponentSourceFiles,
  ScaleImport,
} from "../types.js";

export function vanillaExtractComponentOutput(
  id: string,
  name: string,
  generateSources: (
    scales: Record<string, ScaleImport>,
    breakpoints: readonly BreakpointBinding[] | undefined,
  ) => ComponentSourceFiles,
): ComponentOutput {
  return {
    runtimeDependencies: { "@vanilla-extract/css": "^1.17.4", react: ">=18" },
    generate: ({ scales, breakpoints }) => {
      const sources = generateSources(scales, breakpoints);
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
