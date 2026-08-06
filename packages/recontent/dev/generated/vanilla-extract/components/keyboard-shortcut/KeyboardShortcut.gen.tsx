import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from "react";
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
