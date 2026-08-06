import type { ReactNode } from "react";
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

const IndicatorIcon = icons["chevronDown"];

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
