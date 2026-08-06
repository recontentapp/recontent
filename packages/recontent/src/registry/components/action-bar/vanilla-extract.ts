import type { ComponentSourceFiles, TokenImport } from "../../types.js";

export function generateActionBarSources(bindings: {
  backgroundColor: TokenImport;
  color: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  shadow: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  offset: TokenImport;
}): ComponentSourceFiles {
  const {
    backgroundColor,
    color,
    border,
    borderRadius,
    shadow,
    horizontalSpacing,
    verticalSpacing,
    gap,
    offset,
  } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const actionBarRoot = style({
  position: "fixed",
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  zIndex: 40,
  backgroundColor: ${backgroundColor.reference},
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  boxShadow: ${shadow.reference},
  gap: ${gap.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
});

export const actionBarHidden = style({
  display: "none",
});

export const actionBarPlacement = styleVariants({
  "bottom-start": {
    bottom: ${offset.reference},
    left: ${offset.reference},
  },
  bottom: {
    bottom: ${offset.reference},
    left: "50%",
    transform: "translateX(-50%)",
  },
  "bottom-end": {
    bottom: ${offset.reference},
    right: ${offset.reference},
  },
});
`,
    component: `import type { ReactNode } from "react";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { actionBarHidden, actionBarPlacement, actionBarRoot } from "./ActionBar.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface ActionBarProps extends CommonComponentProps {
  placement?: "bottom-start" | "bottom" | "bottom-end";
  /** Hides the bar without unmounting its children's state when false. */
  open?: boolean;
  children?: ReactNode;
  render?: RenderProp<"div">;
}

export function ActionBar({
  placement = "bottom",
  open = true,
  className,
  render,
  children,
  ...props
}: ActionBarProps) {
  const classes = [
    actionBarRoot,
    actionBarPlacement[placement],
    !open && actionBarHidden,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseToolbar.Root
      {...props}
      render={render}
      className={classes}
      data-slot="action-bar"
      aria-hidden={!open || undefined}
    >
      {children}
    </BaseToolbar.Root>
  );
}
`,
  };
}
