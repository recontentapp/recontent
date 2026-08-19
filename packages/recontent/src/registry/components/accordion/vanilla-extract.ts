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

export interface AccordionItemData {
  value: string;
  trigger: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends CommonComponentProps {
  items: AccordionItemData[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  render?: RenderProp<"div">;
}

export function Accordion({
  items,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
  disabled = false,
  className,
  render,
  ...props
}: AccordionProps) {
  const classes = [accordionRoot, className].filter(Boolean).join(" ");

  return (
    <BaseAccordion.Root
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(nextValue as string[])}
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
