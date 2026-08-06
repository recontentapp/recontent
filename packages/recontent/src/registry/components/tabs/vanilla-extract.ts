import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { groupVariantTokens } from "../shared.js";

const VARIANT_FIELDS = [
  "color",
  "activeColor",
  "hoverColor",
  "backgroundColor",
  "activeBackgroundColor",
  "indicatorColor",
  "border",
  "borderRadius",
] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function variantListStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      backgroundColor: ${fields.backgroundColor!.reference},
      border: ${fields.border!.reference},
      borderRadius: ${fields.borderRadius!.reference},
    }`;
}

function variantTabStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      color: ${fields.color!.reference},
      borderRadius: ${fields.borderRadius!.reference},
      ":hover": {
        color: ${fields.hoverColor!.reference},
      },
      selectors: {
        "&[data-selected]": {
          color: ${fields.activeColor!.reference},
          backgroundColor: ${fields.activeBackgroundColor!.reference},
        },
      },
    }`;
}

function variantIndicatorStyleBody(fields: Record<string, TokenImport>): string {
  return `{ backgroundColor: ${fields.indicatorColor!.reference} }`;
}

export function generateTabsSources(bindings: {
  typography: TokenImport;
  activeTypography: TokenImport;
  disabledColor: TokenImport;
  indicatorThickness: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  tabGap: TokenImport;
  panelSpacing: TokenImport;
  iconSize: TokenImport;
  focusRingColor: TokenImport;
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
    typography,
    activeTypography,
    disabledColor,
    indicatorThickness,
    horizontalSpacing,
    verticalSpacing,
    gap,
    tabGap,
    panelSpacing,
    iconSize,
    focusRingColor,
    tokens,
  } = bindings;
  const variants = groupVariantTokens(tokens, "variants", VARIANT_FIELDS);
  const variantNames = Object.keys(variants);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const tabsRoot = style({
  display: "flex",
  boxSizing: "border-box",
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "row",
    },
    '&[data-orientation="horizontal"]': {
      flexDirection: "column",
    },
  },
});

export const tabsList = style({
  position: "relative",
  display: "flex",
  boxSizing: "border-box",
  gap: ${gap.reference},
  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: "column",
    },
  },
});

export const tabsListVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantListStyleBody(variants[name]!)},`).join("\n")}
});

export const tabsListFitted = style({
  selectors: {
    '&[data-orientation="horizontal"] > *': { flex: 1 },
  },
});

export const tabsTab = style({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  background: "none",
  zIndex: 1,
  gap: ${tabGap.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
  ":focus-visible": {
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
  },
  selectors: {
    "&[data-selected]": {
      ${typographyProps(activeTypography.reference)},
    },
    "&[data-disabled]": {
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const tabsTabVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantTabStyleBody(variants[name]!)},`).join("\n")}
});

export const tabsTabIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const tabsIndicator = style({
  position: "absolute",
  transitionProperty: "translate, width, height",
  transitionDuration: "200ms",
  selectors: {
    '[data-orientation="horizontal"] &': {
      bottom: 0,
      height: ${indicatorThickness.reference},
      left: 0,
      width: "var(--active-tab-width)",
      translate: "var(--active-tab-left) 0",
    },
    '[data-orientation="vertical"] &': {
      right: 0,
      width: ${indicatorThickness.reference},
      top: 0,
      height: "var(--active-tab-height)",
      translate: "0 var(--active-tab-top)",
    },
  },
});

export const tabsIndicatorVariant = styleVariants({
${variantNames.map((name) => `  ${JSON.stringify(name)}: ${variantIndicatorStyleBody(variants[name]!)},`).join("\n")}
});

export const tabsPanel = style({
  boxSizing: "border-box",
  padding: ${panelSpacing.reference},
});
`,
    component: `import { Tabs as BaseTabs } from "@base-ui/react/tabs";
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

export type TabsVariant = ${variantNames.map((n) => JSON.stringify(n)).join(" | ")};

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
  variant = ${JSON.stringify(variantNames[0] ?? "line")},
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
`,
  };
}
