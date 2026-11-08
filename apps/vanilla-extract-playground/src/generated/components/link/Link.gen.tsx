import type { ComponentPropsWithoutRef, MouseEventHandler, ReactNode } from "react";
import { linkRoot, linkUnderline } from "./Link.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";

export interface LinkProps extends CommonComponentProps {
  href?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  underline?: "always" | "hover" | "none";
  children?: ReactNode;
  render?: RenderProp<"a">;
}

/**
 * Navigates to another page or location.
 *
 * @usage Use for navigation, inside text or on its own. Use {@link Button} for actions that change
 * something.
 *
 * @example
 * <Link href="/docs" underline="hover">
 *   Read the docs
 * </Link>
 *
 * @category Actions
 */
export function Link({
  href,
  target,
  rel,
  onClick,
  underline = "always",
  className,
  render,
  children,
  ...props
}: LinkProps) {
  const classes = [linkRoot, linkUnderline[underline], className].filter(Boolean).join(" ");

  const rootProps: Record<string, unknown> = {
    ...props,
    href,
    target,
    rel,
    onClick,
    "data-slot": "link",
    className: classes,
    children,
  };

  return renderElement("a", render, rootProps as ComponentPropsWithoutRef<"a">);
}
