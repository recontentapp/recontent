import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock } from "./shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

function generateCollapsibleSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  hoverBackgroundColor: TokenImport;
  triggerHorizontalSpacing: TokenImport;
  triggerVerticalSpacing: TokenImport;
  triggerTypography: TokenImport;
  triggerColor: TokenImport;
  contentHorizontalSpacing: TokenImport;
  contentVerticalSpacing: TokenImport;
  transition: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  indicatorIcon: string;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    backgroundColor,
    hoverBackgroundColor,
    triggerHorizontalSpacing,
    triggerVerticalSpacing,
    triggerTypography,
    triggerColor,
    contentHorizontalSpacing,
    contentVerticalSpacing,
    transition,
    indicatorIcon,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const collapsibleRoot = style({
  boxSizing: "border-box",
  borderRadius: ${borderRadius.reference},
  border: ${border.reference},
  backgroundColor: ${backgroundColor.reference},
  overflow: "hidden",
});

export const collapsibleTrigger = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: ${triggerColor.reference},
  paddingLeft: ${triggerHorizontalSpacing.reference},
  paddingRight: ${triggerHorizontalSpacing.reference},
  paddingTop: ${triggerVerticalSpacing.reference},
  paddingBottom: ${triggerVerticalSpacing.reference},
  ${typographyProps(triggerTypography.reference)},
  transitionProperty: "background-color",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&:hover, &:focus-visible": {
      backgroundColor: ${hoverBackgroundColor.reference},
    },
  },
  ${focusRingBlock(focusRingColor)}
});

export const collapsibleIndicator = style({
  display: "inline-flex",
  flexShrink: 0,
  width: "1em",
  height: "1em",
  transitionProperty: "transform",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "[data-panel-open] &": { transform: "rotate(180deg)" },
  },
});

export const collapsiblePanel = style({
  overflow: "hidden",
  height: "var(--collapsible-panel-height)",
  transitionProperty: "height",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      height: 0,
    },
  },
});

export const collapsiblePanelContent = style({
  boxSizing: "border-box",
  paddingLeft: ${contentHorizontalSpacing.reference},
  paddingRight: ${contentHorizontalSpacing.reference},
  paddingTop: ${contentVerticalSpacing.reference},
  paddingBottom: ${contentVerticalSpacing.reference},
});
`,
    component: `import type { ReactNode } from "react";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import {
  collapsibleIndicator,
  collapsiblePanel,
  collapsiblePanelContent,
  collapsibleRoot,
  collapsibleTrigger,
} from "./Collapsible.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const IndicatorIcon = icons[${JSON.stringify(indicatorIcon)}];

export interface CollapsibleProps extends CommonComponentProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  render?: RenderProp<"div">;
}

export function Collapsible({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  disabled = false,
  className,
  render,
  ...props
}: CollapsibleProps) {
  const classes = [collapsibleRoot, className].filter(Boolean).join(" ");

  return (
    <BaseCollapsible.Root
      {...props}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(nextOpen) => onOpenChange?.(nextOpen)}
      disabled={disabled}
      render={render}
      className={classes}
      data-slot="collapsible"
    >
      <BaseCollapsible.Trigger className={collapsibleTrigger}>
        {trigger}
        <IndicatorIcon className={collapsibleIndicator} aria-hidden="true" />
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className={collapsiblePanel}>
        <div className={collapsiblePanelContent}>{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type CollapsibleComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  triggerHorizontalSpacing: TokenBinding<"dimension">;
  triggerVerticalSpacing: TokenBinding<"dimension">;
  triggerTypography: TokenBinding<"typography">;
  triggerColor: TokenBinding<"color">;
  contentHorizontalSpacing: TokenBinding<"dimension">;
  contentVerticalSpacing: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
  indicatorIcon: IconName;
};

export const collapsibleComponent = defineRegistryComponent<CollapsibleComponentOptions>()({
  id: "collapsible",
  name: "Collapsible",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the collapsible.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the collapsible.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the collapsible.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the trigger on hover.",
    },
    triggerHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the trigger.",
    },
    triggerVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the trigger.",
    },
    triggerTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the trigger.",
    },
    triggerColor: {
      kind: "token",
      type: "color",
      description: "Text color of the trigger.",
    },
    contentHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the panel content.",
    },
    contentVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the panel content.",
    },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition of the indicator's open/close rotation.",
    },
    indicatorIcon: {
      kind: "icon",
      description: "Icon rendered by the trigger, rotated on open.",
    },
  },
  output: vanillaExtractComponentOutput(
    "collapsible",
    "Collapsible",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateCollapsibleSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        hoverBackgroundColor: tokens.hoverBackgroundColor!,
        triggerHorizontalSpacing: tokens.triggerHorizontalSpacing!,
        triggerVerticalSpacing: tokens.triggerVerticalSpacing!,
        triggerTypography: tokens.triggerTypography!,
        triggerColor: tokens.triggerColor!,
        contentHorizontalSpacing: tokens.contentHorizontalSpacing!,
        contentVerticalSpacing: tokens.contentVerticalSpacing!,
        transition: tokens.transition!,
        indicatorIcon: icons.indicatorIcon!,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
