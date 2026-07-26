import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { importName, requiredTokens } from "../shared.js";

export function generateDividerSources({
  tokens,
}: {
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  requiredTokens("Divider", tokens, ["color", "thickness"]);

  const valueImports = Object.values(tokens)
    .map(({ reference }) => importName(reference))
    .filter((name, index, imports) => imports.indexOf(name) === index)
    .join(", ");

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${valueImports} } from "../../tokens.css";

export const dividerRoot = style({
  flexShrink: 0,
  backgroundColor: ${tokens.color?.reference},
});

export const dividerOrientation = styleVariants({
  horizontal: {
    height: ${tokens.thickness?.reference},
    width: "100%",
  },
  vertical: {
    width: ${tokens.thickness?.reference},
    alignSelf: "stretch",
  },
});
`,
    component: `import type { ComponentPropsWithoutRef } from "react";
import { dividerOrientation, dividerRoot } from "./Divider.gen.css";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = ComponentPropsWithoutRef<"div"> & {
  orientation?: DividerOrientation;
  decorative?: boolean;
};

export function Divider({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: DividerProps) {
  const classes = [
    dividerRoot,
    dividerOrientation[orientation],
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      data-slot="divider"
      data-orientation={orientation}
      {...props}
      className={classes}
    />
  );
}
`,
  };
}
