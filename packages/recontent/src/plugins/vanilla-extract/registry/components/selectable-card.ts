import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock } from "./shared.js";

function generateSelectableCardSources(bindings: {
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

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type SelectableCardComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  activeBorderColor: TokenBinding<"color">;
  hoverBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
};

export const selectableCardComponent = defineRegistryComponent<SelectableCardComponentOptions>()({
  id: "selectable-card",
  name: "SelectableCard",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the card.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the card.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card.",
    },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card when selected.",
    },
    activeBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the card when selected.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the card on hover.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the card when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the card when disabled.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the card.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the card.",
    },
  },
  output: vanillaExtractComponentOutput(
    "selectable-card",
    "SelectableCard",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateSelectableCardSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        activeBackgroundColor: tokens.activeBackgroundColor!,
        activeBorderColor: tokens.activeBorderColor!,
        hoverBorderColor: tokens.hoverBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        focusRingColor,
      }),
  ),
});
