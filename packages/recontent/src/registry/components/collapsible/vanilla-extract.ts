import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

export function generateCollapsibleSources(bindings: {
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
  ":hover": {
    backgroundColor: ${hoverBackgroundColor.reference},
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
