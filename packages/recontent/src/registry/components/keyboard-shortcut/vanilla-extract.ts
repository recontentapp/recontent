import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n    ");
}

export function generateKeyboardShortcutSources(bindings: {
  color: TokenImport;
  backgroundColor: TokenImport;
  border: TokenImport;
  borderRadius: TokenImport;
  typography: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
}): ComponentSourceFiles {
  const {
    color,
    backgroundColor,
    border,
    borderRadius,
    typography,
    horizontalSpacing,
    verticalSpacing,
    gap,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const keyboardShortcutRoot = style({
  display: "inline-flex",
  alignItems: "center",
  gap: ${gap.reference},
});

export const keyboardShortcutKey = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  color: ${color.reference},
  backgroundColor: ${backgroundColor.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
});
`,
    component: `import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { keyboardShortcutKey, keyboardShortcutRoot } from "./KeyboardShortcut.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface KeyboardShortcutProps extends CommonComponentProps {
  keys: string[];
  /** Rendered between keys. Defaults to nothing (keys are separate elements). */
  separator?: ReactNode;
  render?: RenderProp<"span">;
}

export function KeyboardShortcut({
  keys,
  separator,
  className,
  render,
  ...props
}: KeyboardShortcutProps) {
  const classes = [keyboardShortcutRoot, className].filter(Boolean).join(" ");

  const content = keys.map((key, index) => (
    <Fragment key={index}>
      {index > 0 && separator}
      <kbd className={keyboardShortcutKey}>{key}</kbd>
    </Fragment>
  ));

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "keyboard-shortcut",
    className: classes,
    children: content,
  };

  return renderElement("span", render, rootProps as ComponentPropsWithoutRef<"span">);
}
`,
  };
}
