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

export function generateAccordionSources(bindings: {
  border: TokenImport;
  borderRadius: TokenImport;
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
  /**
   * Build-time toggle (not a token binding) between a full border wrapping
   * the whole accordion and a border-bottom-only look between items.
   */
  borderBottomOnly: boolean;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    border,
    borderRadius,
    hoverBackgroundColor,
    triggerHorizontalSpacing,
    triggerVerticalSpacing,
    triggerTypography,
    triggerColor,
    contentHorizontalSpacing,
    contentVerticalSpacing,
    transition,
    indicatorIcon,
    borderBottomOnly,
    focusRingColor,
  } = bindings;

  const rootBorderRule = borderBottomOnly
    ? ""
    : `  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  overflow: "hidden",
`;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const accordionRoot = style({
  boxSizing: "border-box",
${rootBorderRule}});

export const accordionItem = style({
  boxSizing: "border-box",
  borderBottom: ${border.reference},
  selectors: {
    "&:last-child": { borderBottom: "none" },
  },
});

export const accordionHeader = style({
  margin: 0,
});

export const accordionTrigger = style({
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
  ":hover": {
    backgroundColor: ${hoverBackgroundColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
});

export const accordionIndicator = style({
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

export const accordionPanel = style({
  overflow: "hidden",
  height: "var(--accordion-panel-height)",
  transitionProperty: "height",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "&[data-starting-style], &[data-ending-style]": {
      height: 0,
    },
  },
});

export const accordionContent = style({
  boxSizing: "border-box",
  paddingLeft: ${contentHorizontalSpacing.reference},
  paddingRight: ${contentHorizontalSpacing.reference},
  paddingTop: ${contentVerticalSpacing.reference},
  paddingBottom: ${contentVerticalSpacing.reference},
});
`,
    component: `import type { ReactNode } from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import {
  accordionContent,
  accordionHeader,
  accordionIndicator,
  accordionItem,
  accordionPanel,
  accordionRoot,
  accordionTrigger,
} from "./Accordion.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const IndicatorIcon = icons[${JSON.stringify(indicatorIcon)}];

export interface AccordionItemData<Value extends string = string> {
  value: Value;
  trigger: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps<Value extends string = string> extends CommonComponentProps {
  items: AccordionItemData<Value>[];
  value?: Value[];
  defaultValue?: Value[];
  onValueChange?: (value: Value[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  render?: RenderProp<"div">;
}

export function Accordion<Value extends string = string>({
  items,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled = false,
  className,
  render,
  ...props
}: AccordionProps<Value>) {
  const classes = [accordionRoot, className].filter(Boolean).join(" ");

  return (
    <BaseAccordion.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue as Value[])}
      multiple={multiple}
      disabled={disabled}
      render={render}
      className={classes}
      data-slot="accordion"
    >
      {items.map((item) => (
        <BaseAccordion.Item
          key={item.value}
          value={item.value}
          disabled={item.disabled}
          className={accordionItem}
        >
          <BaseAccordion.Header className={accordionHeader}>
            <BaseAccordion.Trigger className={accordionTrigger}>
              {item.trigger}
              <IndicatorIcon className={accordionIndicator} aria-hidden="true" />
            </BaseAccordion.Trigger>
          </BaseAccordion.Header>
          <BaseAccordion.Panel className={accordionPanel}>
            <div className={accordionContent}>{item.content}</div>
          </BaseAccordion.Panel>
        </BaseAccordion.Item>
      ))}
    </BaseAccordion.Root>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type AccordionComponentOptions = {
  border: TokenBinding<"border">;
  borderRadius: TokenBinding<"dimension">;
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

/**
 * Build-time toggle (not a token binding) between a full border wrapping the
 * whole accordion and a border-bottom-only look between items.
 */
const BORDER_BOTTOM_ONLY = false;

export const accordionComponent = defineRegistryComponent<AccordionComponentOptions>()({
  id: "accordion",
  name: "Accordion",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the accordion (or between its items).",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the accordion.",
    },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a trigger on hover.",
    },
    triggerHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of each trigger.",
    },
    triggerVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of each trigger.",
    },
    triggerTypography: {
      kind: "token",
      type: "typography",
      description: "Typography used by each trigger.",
    },
    triggerColor: {
      kind: "token",
      type: "color",
      description: "Text color of each trigger.",
    },
    contentHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of each panel's content.",
    },
    contentVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of each panel's content.",
    },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition of each indicator's open/close rotation.",
    },
    indicatorIcon: {
      kind: "icon",
      description: "Icon rendered by each item's trigger, rotated on open.",
    },
  },
  output: vanillaExtractComponentOutput(
    "accordion",
    "Accordion",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateAccordionSources({
        border: tokens.border!,
        borderRadius: tokens.borderRadius!,
        hoverBackgroundColor: tokens.hoverBackgroundColor!,
        triggerHorizontalSpacing: tokens.triggerHorizontalSpacing!,
        triggerVerticalSpacing: tokens.triggerVerticalSpacing!,
        triggerTypography: tokens.triggerTypography!,
        triggerColor: tokens.triggerColor!,
        contentHorizontalSpacing: tokens.contentHorizontalSpacing!,
        contentVerticalSpacing: tokens.contentVerticalSpacing!,
        transition: tokens.transition!,
        indicatorIcon: icons.indicatorIcon!,
        borderBottomOnly: BORDER_BOTTOM_ONLY,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
