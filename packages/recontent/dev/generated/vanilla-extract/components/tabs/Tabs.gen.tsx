import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";
import {
  tabsIndicator,
  tabsIndicatorVariant,
  tabsList,
  tabsListFitted,
  tabsListVariant,
  tabsPanel,
  tabsRoot,
  tabsTab,
  tabsTabIcon,
  tabsTabVariant,
} from "./Tabs.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export type TabsVariant = "line" | "pill";

export interface TabItem {
  value: string;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
  content: ReactNode;
}

export interface TabsProps extends CommonComponentProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  variant?: TabsVariant;
  /** Distributes tabs evenly across the full width. */
  fitted?: boolean;
  render?: RenderProp<"div">;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  variant = "line",
  fitted = false,
  className,
  render,
  ...props
}: TabsProps) {
  const classes = [tabsRoot, className].filter(Boolean).join(" ");

  return (
    <BaseTabs.Root
      {...props}
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={(next) => onValueChange?.(next as string)}
      orientation={orientation}
      render={render}
      className={classes}
      data-slot="tabs"
    >
      <BaseTabs.List
        className={[tabsList, tabsListVariant[variant], fitted && tabsListFitted].filter(Boolean).join(" ")}
      >
        {items.map((item) => {
          const Icon = item.icon ? icons[item.icon] : undefined;
          return (
            <BaseTabs.Tab
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              className={[tabsTab, tabsTabVariant[variant]].join(" ")}
            >
              {Icon && <Icon className={tabsTabIcon} aria-hidden="true" />}
              {item.label}
            </BaseTabs.Tab>
          );
        })}
        <BaseTabs.Indicator className={[tabsIndicator, tabsIndicatorVariant[variant]].join(" ")} />
      </BaseTabs.List>
      {items.map((item) => (
        <BaseTabs.Panel key={item.value} value={item.value} className={tabsPanel}>
          {item.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
