import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
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

const ExpandIcon = icons["chevronDown"];

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
