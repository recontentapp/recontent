import type { ComponentSourceFiles, TokenImport } from "../types.js";

function generateActionBarSources(bindings: {
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
  opacity: 1,
  transform: "translateY(0)",
  pointerEvents: "auto",
  transitionProperty: "opacity, transform",
  transitionDuration: "200ms",
  transitionTimingFunction: "ease",
});

/**
 * Stays in the DOM (not \`display: none\`) so opacity/transform can actually
 * transition — a display toggle can't be animated with plain CSS transitions.
 */
export const actionBarHidden = style({
  opacity: 0,
  transform: "translateY(0.5rem)",
  pointerEvents: "none",
});

export const actionBarPlacement = styleVariants({
  "bottom-start": {
    bottom: ${offset.reference},
    left: ${offset.reference},
  },
  bottom: {
    bottom: ${offset.reference},
    left: "50%",
    translate: "-50% 0",
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

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type ActionBarComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
  shadow: TokenBinding<"shadow">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  offset: TokenBinding<"dimension">;
};

export const actionBarComponent = defineRegistryComponent<ActionBarComponentOptions>()({
  id: "action-bar",
  name: "ActionBar",
  internalDependencies: ["render-element"],
  schema: {
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the action bar.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Text color of the action bar.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the action bar.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the action bar.",
    },
    shadow: {
      kind: "token",
      type: "shadow",
      description: "Shadow applied to the action bar.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the action bar.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the action bar.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between actions.",
    },
    offset: {
      kind: "token",
      type: "dimension",
      description: "Distance from the viewport edge.",
    },
  },
  output: vanillaExtractComponentOutput(
    "action-bar",
    "ActionBar",
    (_scales, _breakpoints, tokens) =>
      generateActionBarSources({
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        shadow: tokens.shadow!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        offset: tokens.offset!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
