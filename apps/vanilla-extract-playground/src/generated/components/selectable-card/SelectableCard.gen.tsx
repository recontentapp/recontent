import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { selectableCardRoot } from "./SelectableCard.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface SelectableCardProps extends CommonComponentProps {
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  /** `"radio"` renders a single-select option, `"checkbox"` a multi-select one. */
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
