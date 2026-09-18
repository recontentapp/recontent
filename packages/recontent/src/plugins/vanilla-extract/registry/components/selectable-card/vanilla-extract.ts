import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

export function generateSelectableCardSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  activeBackgroundColor: TokenImport;
  activeBorderColor: TokenImport;
  hoverBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    backgroundColor,
    activeBackgroundColor,
    activeBorderColor,
    hoverBorderColor,
    disabledBackgroundColor,
    disabledColor,
    horizontalSpacing,
    verticalSpacing,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const selectableCardRoot = style({
  display: "flex",
  boxSizing: "border-box",
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-selected]": {
      backgroundColor: ${activeBackgroundColor.reference},
      borderColor: ${activeBorderColor.reference},
    },
    "&:disabled": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});
`,
    component: `import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { selectableCardRoot } from "./SelectableCard.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface SelectableCardProps extends CommonComponentProps {
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  /** \`"radio"\` renders a single-select option, \`"checkbox"\` a multi-select one. */
  control?: "radio" | "checkbox";
  value?: string;
  name?: string;
  children?: ReactNode;
  render?: RenderProp<"button">;
}

export function SelectableCard({
  selected,
  defaultSelected = false,
  onSelectedChange,
  disabled = false,
  control = "radio",
  value,
  name,
  className,
  render,
  children,
  ...props
}: SelectableCardProps) {
  const [uncontrolledSelected, setUncontrolledSelected] = useState(defaultSelected);
  const isControlled = selected !== undefined;
  const isSelected = isControlled ? selected : uncontrolledSelected;

  function handleClick() {
    if (disabled) return;
    const next = !isSelected;
    if (!isControlled) setUncontrolledSelected(next);
    onSelectedChange?.(next);
  }

  const classes = [selectableCardRoot, className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    type: "button",
    role: control === "radio" ? "radio" : "checkbox",
    "aria-checked": isSelected,
    disabled,
    value,
    name,
    onClick: handleClick,
    "data-slot": "selectable-card",
    "data-selected": isSelected || undefined,
    className: classes,
    children,
  };

  return renderElement("button", render, rootProps as ComponentPropsWithoutRef<"button">);
}
`,
  };
}
