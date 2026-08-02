import type { CSSProperties, ComponentPropsWithoutRef, ReactNode } from "react";
import {
  boxPadding,
  boxPaddingX,
  boxPaddingY,
  boxPaddingTop,
  boxPaddingRight,
  boxPaddingBottom,
  boxPaddingLeft,
  boxMargin,
  boxMarginX,
  boxMarginY,
  boxMarginTop,
  boxMarginRight,
  boxMarginBottom,
  boxMarginLeft,
  boxGap,
  boxBackgroundColor,
  boxBorder,
  boxBorderRadius,
  boxBoxShadow,
  boxRoot,
} from "./Box.gen.css";
import type { SystemSpacing as BoxSpacingToken, SystemColorsSecondary as BoxSurfaceToken, RefRadiusScale as BoxRadiusToken, SystemBorderScale as BoxBorderToken, SystemElevationScale as BoxElevationToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../shared/Shared.gen";

export interface BoxProps extends CommonComponentProps {
  padding?: BoxSpacingToken;
  paddingX?: BoxSpacingToken;
  paddingY?: BoxSpacingToken;
  paddingTop?: BoxSpacingToken;
  paddingRight?: BoxSpacingToken;
  paddingBottom?: BoxSpacingToken;
  paddingLeft?: BoxSpacingToken;
  margin?: BoxSpacingToken;
  marginX?: BoxSpacingToken;
  marginY?: BoxSpacingToken;
  marginTop?: BoxSpacingToken;
  marginRight?: BoxSpacingToken;
  marginBottom?: BoxSpacingToken;
  marginLeft?: BoxSpacingToken;
  gap?: BoxSpacingToken;
  backgroundColor?: BoxSurfaceToken;
  borderRadius?: BoxRadiusToken;
  border?: BoxBorderToken;
  boxShadow?: BoxElevationToken;
  display?: "block" | "inline-block" | "inline" | "flex" | "inline-flex" | "grid" | "none";
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  minWidth?: CSSProperties["minWidth"];
  minHeight?: CSSProperties["minHeight"];
  maxWidth?: CSSProperties["maxWidth"];
  maxHeight?: CSSProperties["maxHeight"];
  overflow?: CSSProperties["overflow"];
  children?: ReactNode;
  render?: RenderProp;
}

export function Box({
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginX,
  marginY,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  gap,
  backgroundColor,
  borderRadius,
  border,
  boxShadow,
  display,
  position,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  overflow,
  className,
  render,
  children,
  ...props
}: BoxProps) {
  const classes = [
    boxRoot,
    padding !== undefined && boxPadding[padding],
    paddingX !== undefined && boxPaddingX[paddingX],
    paddingY !== undefined && boxPaddingY[paddingY],
    paddingTop !== undefined && boxPaddingTop[paddingTop],
    paddingRight !== undefined && boxPaddingRight[paddingRight],
    paddingBottom !== undefined && boxPaddingBottom[paddingBottom],
    paddingLeft !== undefined && boxPaddingLeft[paddingLeft],
    margin !== undefined && boxMargin[margin],
    marginX !== undefined && boxMarginX[marginX],
    marginY !== undefined && boxMarginY[marginY],
    marginTop !== undefined && boxMarginTop[marginTop],
    marginRight !== undefined && boxMarginRight[marginRight],
    marginBottom !== undefined && boxMarginBottom[marginBottom],
    marginLeft !== undefined && boxMarginLeft[marginLeft],
    gap !== undefined && boxGap[gap],
    backgroundColor !== undefined && boxBackgroundColor[backgroundColor],
    borderRadius !== undefined && boxBorderRadius[borderRadius],
    border !== undefined && boxBorder[border],
    boxShadow !== undefined && boxBoxShadow[boxShadow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = {
    display,
    position,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    overflow,
  };

  const rootProps: Record<string, unknown> = {
    ...props,
    "data-slot": "box",
    className: classes,
    style,
    children,
  };

  return renderElement("div", render, rootProps as ComponentPropsWithoutRef<"div">);
}
