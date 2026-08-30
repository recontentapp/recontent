import { Separator as BaseSeparator } from "@base-ui/react/separator";
import { dividerOrientation, dividerRoot } from "./Divider.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface DividerProps extends CommonComponentProps {
  orientation?: "horizontal" | "vertical";
  render?: RenderProp<"div">;
}

export function Divider({
  orientation = "horizontal",
  className,
  render,
  ...props
}: DividerProps) {
  const classes = [dividerRoot, dividerOrientation[orientation], className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseSeparator
      {...props}
      orientation={orientation}
      render={render}
      className={classes}
      data-slot="divider"
    />
  );
}
