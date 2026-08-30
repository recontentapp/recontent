import type { ReactNode } from "react";
import { Toolbar as BaseToolbar } from "@base-ui/react/toolbar";
import { actionBarHidden, actionBarPlacement, actionBarRoot } from "./ActionBar.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface ActionBarProps extends CommonComponentProps {
  placement?: "bottom-start" | "bottom" | "bottom-end";
  /** Hides the bar without unmounting its children's state when false. */
  open?: boolean;
  children?: ReactNode;
  render?: RenderProp<"div">;
}

export function ActionBar({
  placement = "bottom",
  open = true,
  className,
  render,
  children,
  ...props
}: ActionBarProps) {
  const classes = [
    actionBarRoot,
    actionBarPlacement[placement],
    !open && actionBarHidden,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseToolbar.Root
      {...props}
      render={render}
      className={classes}
      data-slot="action-bar"
      aria-hidden={!open || undefined}
    >
      {children}
    </BaseToolbar.Root>
  );
}
