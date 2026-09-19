import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../types.js";

function generateSpinnerSources(bindings: {
  sizes: ScaleImport;
  colors: ScaleImport;
  trackColor: TokenImport;
  thickness: TokenImport;
  animationDuration: TokenImport;
}): ComponentSourceFiles {
  const { sizes, colors, trackColor, thickness, animationDuration } = bindings;

  return {
    styles: `import { keyframes, style, styleVariants } from "@vanilla-extract/css";
import { ${sizes.exportName}, ${colors.exportName}, vars } from "../../tokens.css";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const spinnerRoot = style({
  boxSizing: "border-box",
  display: "inline-block",
  flexShrink: 0,
  borderRadius: "50%",
  borderStyle: "solid",
  borderWidth: ${thickness.reference},
  borderColor: ${trackColor.reference},
  animationName: spin,
  animationDuration: ${animationDuration.reference},
  animationIterationCount: "infinite",
  animationTimingFunction: "linear",
});

export const spinnerSize = styleVariants(${sizes.exportName}, (value) => ({
  width: value,
  height: value,
}));

export const spinnerColor = styleVariants(${colors.exportName}, (value) => ({
  borderTopColor: value,
}));
`,
    component: `import type { CSSProperties, ComponentPropsWithoutRef } from "react";
import { spinnerColor, spinnerRoot, spinnerSize } from "./Spinner.gen.css";
import { renderElement, type CommonComponentProps, type RenderProp } from "../../renderElement.gen";
import type { ${sizes.typeName} as SpinnerSizeToken, ${colors.typeName} as SpinnerColorToken } from "../../tokens.css";

export interface SpinnerProps extends CommonComponentProps {
  size?: SpinnerSizeToken | number;
  color?: SpinnerColorToken;
  /** Accessible label; omit only when an adjacent element already labels it. */
  label?: string;
  render?: RenderProp<"span">;
}

export function Spinner({ size, color, label, className, render, ...props }: SpinnerProps) {
  const classes = [
    spinnerRoot,
    typeof size === "string" && spinnerSize[size],
    color !== undefined && spinnerColor[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties = typeof size === "number" ? { width: size, height: size } : {};

  const accessibilityProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  const rootProps: Record<string, unknown> = {
    ...props,
    ...accessibilityProps,
    "data-slot": "spinner",
    className: classes,
    style,
  };

  return renderElement("span", render, rootProps as ComponentPropsWithoutRef<"span">);
}
`,
  };
}

import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type SpinnerComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  colors: ScaleBinding<"color">;
  trackColor: TokenBinding<"color">;
  thickness: TokenBinding<"dimension">;
  animationDuration: TokenBinding<"duration">;
};

export const spinnerComponent = defineRegistryComponent<SpinnerComponentOptions>()({
  id: "spinner",
  name: "Spinner",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    colors: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
    trackColor: {
      kind: "token",
      type: "color",
      description: "Color of the spinner's static track.",
    },
    thickness: {
      kind: "token",
      type: "dimension",
      description: "Stroke width of the spinner.",
    },
    animationDuration: {
      kind: "token",
      type: "duration",
      description: "Duration of one full rotation.",
    },
  },
  output: vanillaExtractComponentOutput("spinner", "Spinner", (scales, _breakpoints, tokens) =>
    generateSpinnerSources({
      sizes: scales.sizes!,
      colors: scales.colors!,
      trackColor: tokens.trackColor!,
      thickness: tokens.thickness!,
      animationDuration: tokens.animationDuration!,
    }),
  ),
});
