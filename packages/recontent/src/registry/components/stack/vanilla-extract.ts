import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../../types.js";
import { importName } from "../shared.js";

export function generateStackSources({
  gapScale,
  backgroundColor,
}: {
  gapScale: ScaleImport;
  backgroundColor: TokenImport;
}): ComponentSourceFiles {
  const valueImports = [gapScale.exportName, importName(backgroundColor.reference)]
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const stackRoot = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: ${backgroundColor.reference},
});

export const stackGap = styleVariants(${gapScale.exportName}, (value) => ({
  gap: value,
}));
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { stackGap, stackRoot } from "./Stack.gen.css";
import type { ${gapScale.typeName} } from "../../tokens.css";

export type StackProps = ComponentPropsWithoutRef<"div"> & {
  gap?: ${gapScale.typeName};
};

export function Stack({ gap, className, ...props }: StackProps) {
  const classes = [stackRoot, gap && stackGap[gap], className]
    .filter(Boolean)
    .join(" ");

  return <div data-slot="stack" {...props} className={classes} />;
}
`,
  };
}
