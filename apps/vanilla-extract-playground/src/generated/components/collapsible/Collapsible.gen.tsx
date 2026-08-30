import type { ReactNode } from "react";
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

const IndicatorIcon = icons["chevronDown"];

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
