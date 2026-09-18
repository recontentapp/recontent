import type { ComponentSourceFiles, TokenImport } from "../../types.js";

export function generateDividerSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
  color: TokenImport;
  spacing: TokenImport;
}): ComponentSourceFiles {
  const { border, borderRadius, color, spacing } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dividerRoot = style({
  boxSizing: "border-box",
  flexShrink: 0,
  borderRadius: ${borderRadius.reference},
});

export const dividerOrientation = styleVariants({
  horizontal: {
    width: "100%",
    height: 0,
    borderTop: ${border.reference},
    borderColor: ${color.reference},
    marginTop: ${spacing.reference},
    marginBottom: ${spacing.reference},
  },
  vertical: {
    height: "100%",
    width: 0,
    alignSelf: "stretch",
    borderLeft: ${border.reference},
    borderColor: ${color.reference},
    marginLeft: ${spacing.reference},
    marginRight: ${spacing.reference},
  },
});
`,
    component: `import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { dividerOrientation, dividerRoot } from "./Divider.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface DividerProps extends CommonComponentProps {
  orientation?: "horizontal" | "vertical";
  render?: RenderProp<"div">;
}

export function Divider({
  orientation = "horizontal",
  className,
  render,
  ...props
}: DividerProps) {
  const classes = [dividerRoot, dividerOrientation[orientation], className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseSeparator
      {...props}
      orientation={orientation}
      render={render}
      className={classes}
      data-slot="divider"
    />
  );
}
`,
  };
}
