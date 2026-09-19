import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function generateMetadataListSources(bindings: {
  gaps: ScaleImport;
  labelTypography: TokenImport;
  labelColor: TokenImport;
  valueTypography: TokenImport;
  valueColor: TokenImport;
  pairGap: TokenImport;
  iconSize: TokenImport;
  iconColor: TokenImport;
  divider: TokenImport;
}): ComponentSourceFiles {
  const {
    gaps,
    labelTypography,
    labelColor,
    valueTypography,
    valueColor,
    pairGap,
    iconSize,
    iconColor,
    divider,
  } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${gaps.exportName} } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const metadataListRoot = style({
  display: "grid",
  margin: 0,
  boxSizing: "border-box",
  gridTemplateColumns: "repeat(var(--metadata-list-columns, 1), 1fr)",
});

export const metadataListGap = styleVariants(${gaps.exportName}, (value) => ({ gap: value }));

export const metadataListItem = style({
  boxSizing: "border-box",
  paddingBottom: "0.5rem",
  selectors: {
    "&:not(:last-child)": {
      borderBottom: ${divider.reference},
    },
  },
});

export const metadataListItemHorizontal = style({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: ${pairGap.reference},
});

export const metadataListItemVertical = style({
  display: "flex",
  flexDirection: "column",
  gap: ${pairGap.reference},
});

export const metadataListLabelRow = style({
  display: "inline-flex",
  alignItems: "center",
  gap: ${pairGap.reference},
});

export const metadataListLabel = style({
  margin: 0,
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference)},
});

export const metadataListValue = style({
  margin: 0,
  color: ${valueColor.reference},
  ${typographyProps(valueTypography.reference)},
});

export const metadataListIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: ${iconColor.reference},
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});
`,
    component: `import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import {
  metadataListGap,
  metadataListIcon,
  metadataListItem,
  metadataListItemHorizontal,
  metadataListItemVertical,
  metadataListLabel,
  metadataListLabelRow,
  metadataListRoot,
  metadataListValue,
} from "./MetadataList.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";
import type { ${gaps.typeName} as MetadataListGapToken } from "../../tokens.css";

export interface MetadataListItem {
  label: ReactNode;
  value: ReactNode;
  icon?: IconType;
}

export interface MetadataListProps extends CommonComponentProps {
  items: MetadataListItem[];
  orientation?: "horizontal" | "vertical";
  columns?: number;
  gap?: MetadataListGapToken;
  render?: RenderProp<"dl">;
}

export function MetadataList({
  items,
  orientation = "horizontal",
  columns = 1,
  gap,
  className,
  render,
  ...props
}: MetadataListProps) {
  const classes = [metadataListRoot, gap !== undefined && metadataListGap[gap], className]
    .filter(Boolean)
    .join(" ");
  const style = { "--metadata-list-columns": columns } as CSSProperties;

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "metadata-list",
    className: classes,
    style,
    children: items.map((item, index) => {
      const Icon = item.icon ? icons[item.icon] : undefined;
      const itemLayout = orientation === "horizontal" ? metadataListItemHorizontal : metadataListItemVertical;
      return (
        <div key={index} className={[metadataListItem, itemLayout].join(" ")}>
          <span className={metadataListLabelRow}>
            {Icon && <Icon className={metadataListIcon} aria-hidden="true" />}
            <dt className={metadataListLabel}>{item.label}</dt>
          </span>
          <dd className={metadataListValue}>{item.value}</dd>
        </div>
      );
    }),
  };

  return renderElement("dl", render, rootProps as ComponentPropsWithoutRef<"dl">);
}
`,
  };
}

import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type MetadataListComponentOptions = {
  gaps: ScaleBinding<"dimension">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  valueTypography: TokenBinding<"typography">;
  valueColor: TokenBinding<"color">;
  pairGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  iconColor: TokenBinding<"color">;
  divider: TokenBinding<"border">;
};

export const metadataListComponent = defineRegistryComponent<MetadataListComponentOptions>()({
  id: "metadata-list",
  name: "MetadataList",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    gaps: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the gap prop.",
    },
    labelTypography: { kind: "token", type: "typography", description: "Typography of a label." },
    labelColor: { kind: "token", type: "color", description: "Text color of a label." },
    valueTypography: { kind: "token", type: "typography", description: "Typography of a value." },
    valueColor: { kind: "token", type: "color", description: "Text color of a value." },
    pairGap: {
      kind: "token",
      type: "dimension",
      description: "Space between a label and its value.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of an item's icon." },
    iconColor: { kind: "token", type: "color", description: "Color of an item's icon." },
    divider: { kind: "token", type: "border", description: "Border applied between rows." },
  },
  output: vanillaExtractComponentOutput(
    "metadata-list",
    "MetadataList",
    (scales, _breakpoints, tokens) =>
      generateMetadataListSources({
        gaps: scales.gaps!,
        labelTypography: tokens.labelTypography!,
        labelColor: tokens.labelColor!,
        valueTypography: tokens.valueTypography!,
        valueColor: tokens.valueColor!,
        pairGap: tokens.pairGap!,
        iconSize: tokens.iconSize!,
        iconColor: tokens.iconColor!,
        divider: tokens.divider!,
      }),
  ),
});
