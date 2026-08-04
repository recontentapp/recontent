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
  boxDisplay,
  boxWidth,
  boxHeight,
  boxMinWidth,
  boxMinHeight,
  boxMaxWidth,
  boxMaxHeight,
  boxBackgroundColor,
  boxBorder,
  boxBorderRadius,
  boxBoxShadow,
  boxRoot,
} from "./Box.gen.css";
import { systemSpacing } from "../../tokens.css";
import type { SystemSpacing as BoxSpacingToken, SystemColorsSecondary as BoxSurfaceToken, RefRadiusScale as BoxRadiusToken, SystemBorderScale as BoxBorderToken, SystemElevationScale as BoxElevationToken } from "../../tokens.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import { responsiveVars, type Responsive } from "../../responsive.gen";

export interface BoxProps extends CommonComponentProps {
  padding?: Responsive<BoxSpacingToken>;
  paddingX?: Responsive<BoxSpacingToken>;
  paddingY?: Responsive<BoxSpacingToken>;
  paddingTop?: Responsive<BoxSpacingToken>;
  paddingRight?: Responsive<BoxSpacingToken>;
  paddingBottom?: Responsive<BoxSpacingToken>;
  paddingLeft?: Responsive<BoxSpacingToken>;
  margin?: Responsive<BoxSpacingToken>;
  marginX?: Responsive<BoxSpacingToken>;
  marginY?: Responsive<BoxSpacingToken>;
  marginTop?: Responsive<BoxSpacingToken>;
  marginRight?: Responsive<BoxSpacingToken>;
  marginBottom?: Responsive<BoxSpacingToken>;
  marginLeft?: Responsive<BoxSpacingToken>;
  gap?: Responsive<BoxSpacingToken>;
  backgroundColor?: BoxSurfaceToken;
  borderRadius?: BoxRadiusToken;
  border?: BoxBorderToken;
  boxShadow?: BoxElevationToken;
  display?: Responsive<"block" | "inline-block" | "inline" | "flex" | "inline-flex" | "grid" | "none">;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: Responsive<CSSProperties["width"]>;
  height?: Responsive<CSSProperties["height"]>;
  minWidth?: Responsive<CSSProperties["minWidth"]>;
  minHeight?: Responsive<CSSProperties["minHeight"]>;
  maxWidth?: Responsive<CSSProperties["maxWidth"]>;
  maxHeight?: Responsive<CSSProperties["maxHeight"]>;
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
    padding !== undefined && boxPadding,
    paddingX !== undefined && boxPaddingX,
    paddingY !== undefined && boxPaddingY,
    paddingTop !== undefined && boxPaddingTop,
    paddingRight !== undefined && boxPaddingRight,
    paddingBottom !== undefined && boxPaddingBottom,
    paddingLeft !== undefined && boxPaddingLeft,
    margin !== undefined && boxMargin,
    marginX !== undefined && boxMarginX,
    marginY !== undefined && boxMarginY,
    marginTop !== undefined && boxMarginTop,
    marginRight !== undefined && boxMarginRight,
    marginBottom !== undefined && boxMarginBottom,
    marginLeft !== undefined && boxMarginLeft,
    gap !== undefined && boxGap,
    display !== undefined && boxDisplay,
    width !== undefined && boxWidth,
    height !== undefined && boxHeight,
    minWidth !== undefined && boxMinWidth,
    minHeight !== undefined && boxMinHeight,
    maxWidth !== undefined && boxMaxWidth,
    maxHeight !== undefined && boxMaxHeight,
    backgroundColor !== undefined && boxBackgroundColor[backgroundColor],
    borderRadius !== undefined && boxBorderRadius[borderRadius],
    border !== undefined && boxBorder[border],
    boxShadow !== undefined && boxBoxShadow[boxShadow],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: Record<string, unknown> = {
    position,
    overflow,
    ...responsiveVars("rc-box-padding", padding, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-x", paddingX, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-y", paddingY, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-top", paddingTop, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-right", paddingRight, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-bottom", paddingBottom, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-padding-left", paddingLeft, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin", margin, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-x", marginX, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-y", marginY, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-top", marginTop, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-right", marginRight, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-bottom", marginBottom, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-margin-left", marginLeft, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-gap", gap, (value: BoxSpacingToken) => systemSpacing[value]),
    ...responsiveVars("rc-box-display", display, (value) => value as string),
    ...responsiveVars("rc-box-width", width, (value) => value as string | number),
    ...responsiveVars("rc-box-height", height, (value) => value as string | number),
    ...responsiveVars("rc-box-min-width", minWidth, (value) => value as string | number),
    ...responsiveVars("rc-box-min-height", minHeight, (value) => value as string | number),
    ...responsiveVars("rc-box-max-width", maxWidth, (value) => value as string | number),
    ...responsiveVars("rc-box-max-height", maxHeight, (value) => value as string | number),
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
