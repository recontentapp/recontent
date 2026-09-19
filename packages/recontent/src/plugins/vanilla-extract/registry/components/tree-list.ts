import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock } from "./shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function generateTreeListSources(bindings: {
  typography: TokenImport;
  color: TokenImport;
  hoverBackgroundColor: TokenImport;
  selectedBackgroundColor: TokenImport;
  selectedColor: TokenImport;
  focusRingColor: TokenImport | undefined;
  borderRadius: TokenImport;
  indentSpacing: TokenImport;
  rowHorizontalSpacing: TokenImport;
  rowVerticalSpacing: TokenImport;
  rowGap: TokenImport;
  guideColor: TokenImport;
  iconSize: TokenImport;
  iconColor: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  expandIcon: string;
}): ComponentSourceFiles {
  const {
    typography,
    color,
    hoverBackgroundColor,
    selectedBackgroundColor,
    selectedColor,
    focusRingColor,
    borderRadius,
    indentSpacing,
    rowHorizontalSpacing,
    rowVerticalSpacing,
    rowGap,
    guideColor,
    iconSize,
    iconColor,
    expandIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const treeListRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

export const treeListGroup = style({
  display: "flex",
  flexDirection: "column",
  listStyle: "none",
  margin: 0,
  padding: 0,
  position: "relative",
  selectors: {
    "&:not([data-depth=\\"0\\"])": {
      borderLeft: \`1px solid ${guideColor.reference}\`,
      marginLeft: ${indentSpacing.reference},
    },
  },
});

export const treeListRow = style({
  display: "flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  color: ${color.reference},
  borderRadius: ${borderRadius.reference},
  gap: ${rowGap.reference},
  paddingLeft: ${rowHorizontalSpacing.reference},
  paddingRight: ${rowHorizontalSpacing.reference},
  paddingTop: ${rowVerticalSpacing.reference},
  paddingBottom: ${rowVerticalSpacing.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    backgroundColor: ${hoverBackgroundColor.reference},
  },
  ${focusRingBlock(focusRingColor, { inset: true })}
  selectors: {
    "&[data-selected]": {
      backgroundColor: ${selectedBackgroundColor.reference},
      color: ${selectedColor.reference},
    },
    "&[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const treeListExpand = style({
  display: "inline-flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  color: "inherit",
  width: ${iconSize.reference},
  height: ${iconSize.reference},
  transitionProperty: "transform",
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-expanded]": {
      transform: "rotate(0deg)",
    },
    "&:not([data-expanded])": {
      transform: "rotate(-90deg)",
    },
  },
});

export const treeListExpandSpacer = style({
  display: "inline-block",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const treeListIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  color: ${iconColor.reference},
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const treeListLabel = style({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
`,
    component: `import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  treeListExpand,
  treeListExpandSpacer,
  treeListGroup,
  treeListIcon,
  treeListLabel,
  treeListRoot,
  treeListRow,
} from "./TreeList.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

const ExpandIcon = icons[${JSON.stringify(expandIcon)}];

export interface TreeNode<Value> {
  id: string;
  label: ReactNode;
  icon?: IconType;
  value?: Value;
  children?: TreeNode<Value>[];
  disabled?: boolean;
}

export interface TreeListProps<Value> extends CommonComponentProps {
  nodes: TreeNode<Value>[];
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  onExpandedIdsChange?: (ids: string[]) => void;
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  /** Fired on Enter or double-click — distinct from selection. */
  onNodeActivate?: (node: TreeNode<Value>) => void;
  /** Accessible name for the tree. */
  label?: string;
  render?: RenderProp<"div">;
}

function TreeListGroup<Value>({
  nodes,
  depth,
  expandedIds,
  selectedId,
  toggleExpanded,
  onSelectedIdChange,
  onNodeActivate,
}: {
  nodes: TreeNode<Value>[];
  depth: number;
  expandedIds: string[];
  selectedId: string | undefined;
  toggleExpanded: (id: string) => void;
  onSelectedIdChange: ((id: string) => void) | undefined;
  onNodeActivate: ((node: TreeNode<Value>) => void) | undefined;
}) {
  return (
    <ul role="group" className={treeListGroup} data-depth={depth}>
      {nodes.map((node) => {
        const hasChildren = !!node.children && node.children.length > 0;
        const expanded = expandedIds.includes(node.id);
        const Icon = node.icon ? icons[node.icon] : undefined;

        return (
          <li key={node.id} role="none">
            <div
              role="treeitem"
              aria-expanded={hasChildren ? expanded : undefined}
              aria-selected={node.id === selectedId}
              aria-disabled={node.disabled || undefined}
              data-selected={node.id === selectedId || undefined}
              data-disabled={node.disabled || undefined}
              tabIndex={node.disabled ? -1 : 0}
              className={treeListRow}
              onClick={() => !node.disabled && onSelectedIdChange?.(node.id)}
              onDoubleClick={() => !node.disabled && onNodeActivate?.(node)}
              onKeyDown={(event) => {
                if (node.disabled) return;
                if (event.key === "Enter") onNodeActivate?.(node);
                if (event.key === "ArrowRight" && hasChildren && !expanded) toggleExpanded(node.id);
                if (event.key === "ArrowLeft" && hasChildren && expanded) toggleExpanded(node.id);
              }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={treeListExpand}
                  data-expanded={expanded || undefined}
                  aria-label={expanded ? "Collapse" : "Expand"}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                >
                  <ExpandIcon aria-hidden="true" />
                </button>
              ) : (
                <span className={treeListExpandSpacer} aria-hidden="true" />
              )}
              {Icon && <Icon className={treeListIcon} aria-hidden="true" />}
              <span className={treeListLabel}>{node.label}</span>
            </div>
            {hasChildren && expanded && (
              <TreeListGroup
                nodes={node.children!}
                depth={depth + 1}
                expandedIds={expandedIds}
                selectedId={selectedId}
                toggleExpanded={toggleExpanded}
                onSelectedIdChange={onSelectedIdChange}
                onNodeActivate={onNodeActivate}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TreeList<Value>({
  nodes,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedIdsChange,
  selectedId,
  onSelectedIdChange,
  onNodeActivate,
  label,
  className,
  render,
  ...props
}: TreeListProps<Value>) {
  const [uncontrolledExpandedIds, setUncontrolledExpandedIds] = useState<string[]>(defaultExpandedIds);
  const isControlled = expandedIds !== undefined;
  const currentExpandedIds = isControlled ? expandedIds : uncontrolledExpandedIds;

  function toggleExpanded(id: string) {
    const next = currentExpandedIds.includes(id)
      ? currentExpandedIds.filter((existing) => existing !== id)
      : [...currentExpandedIds, id];
    if (!isControlled) setUncontrolledExpandedIds(next);
    onExpandedIdsChange?.(next);
  }

  const classes = [treeListRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    role: "tree",
    "aria-label": label,
    "data-slot": "tree-list",
    className: classes,
    children: (
      <TreeListGroup
        nodes={nodes}
        depth={0}
        expandedIds={currentExpandedIds}
        selectedId={selectedId}
        toggleExpanded={toggleExpanded}
        onSelectedIdChange={onSelectedIdChange}
        onNodeActivate={onNodeActivate}
      />
    ),
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type TreeListComponentOptions = {
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  hoverBackgroundColor: TokenBinding<"color">;
  selectedBackgroundColor: TokenBinding<"color">;
  selectedColor: TokenBinding<"color">;
  borderRadius: TokenBinding<"dimension">;
  indentSpacing: TokenBinding<"dimension">;
  rowHorizontalSpacing: TokenBinding<"dimension">;
  rowVerticalSpacing: TokenBinding<"dimension">;
  rowGap: TokenBinding<"dimension">;
  guideColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  iconColor: TokenBinding<"color">;
  expandIcon: IconName;
};

export const treeListComponent = defineRegistryComponent<TreeListComponentOptions>()({
  id: "tree-list",
  name: "TreeList",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to a row's label.",
    },
    color: { kind: "token", type: "color", description: "Text color of a row." },
    hoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a row on hover.",
    },
    selectedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected row.",
    },
    selectedColor: { kind: "token", type: "color", description: "Text color of the selected row." },
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of a row." },
    indentSpacing: {
      kind: "token",
      type: "dimension",
      description: "Indent applied per depth level.",
    },
    rowHorizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of a row.",
    },
    rowVerticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of a row.",
    },
    rowGap: {
      kind: "token",
      type: "dimension",
      description: "Space between the indicator, icon and label.",
    },
    guideColor: { kind: "token", type: "color", description: "Color of the indent guide lines." },
    iconSize: { kind: "token", type: "dimension", description: "Size of a row's icon." },
    iconColor: { kind: "token", type: "color", description: "Color of a row's icon." },
    expandIcon: {
      kind: "icon",
      description: "Icon rendered by a row's expand/collapse indicator.",
    },
  },
  output: vanillaExtractComponentOutput(
    "tree-list",
    "TreeList",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateTreeListSources({
        typography: tokens.typography!,
        color: tokens.color!,
        hoverBackgroundColor: tokens.hoverBackgroundColor!,
        selectedBackgroundColor: tokens.selectedBackgroundColor!,
        selectedColor: tokens.selectedColor!,
        focusRingColor,
        borderRadius: tokens.borderRadius!,
        indentSpacing: tokens.indentSpacing!,
        rowHorizontalSpacing: tokens.rowHorizontalSpacing!,
        rowVerticalSpacing: tokens.rowVerticalSpacing!,
        rowGap: tokens.rowGap!,
        guideColor: tokens.guideColor!,
        iconSize: tokens.iconSize!,
        iconColor: tokens.iconColor!,
        expandIcon: icons.expandIcon!,
      }),
  ),
});
