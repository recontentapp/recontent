import type { ComponentSourceFiles, ScaleImport } from "../types.js";

function generateIconSources({
  size,
  color,
}: {
  size: ScaleImport;
  color: ScaleImport;
}): ComponentSourceFiles {
  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${size.exportName}, ${color.exportName} } from "../../tokens.css";

export const iconRoot = style({ display: "inline-block", flexShrink: 0 });

export const iconSize = styleVariants(${size.exportName}, (value) => ({ width: value, height: value }));

export const iconColor = styleVariants(${color.exportName}, (value) => ({ color: value }));
`,
    component: `import type { CSSProperties } from "react";
import { iconColor, iconRoot, iconSize } from "./Icon.gen.css";
import type { ${size.typeName} as IconSizeToken, ${color.typeName} as IconColorToken } from "../../tokens.css";
import type { CommonComponentProps } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

export interface IconProps extends CommonComponentProps {
  icon: IconType;
  size?: IconSizeToken | number;
  color?: IconColorToken;
  label?: string;
}

export function Icon({ icon, size, color, label, className, ...props }: IconProps) {
  const Component = icons[icon];

  const classes = [
    iconRoot,
    typeof size === "string" && iconSize[size],
    color !== undefined && iconColor[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style: CSSProperties =
    typeof size === "number" ? { width: size, height: size } : {};

  const accessibilityProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };

  return (
    <Component
      {...props}
      {...accessibilityProps}
      data-slot="icon"
      className={classes}
      style={style}
    />
  );
}
`,
  };
}

import type { ScaleBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type IconComponentOptions = {
  size: ScaleBinding<"dimension">;
  color: ScaleBinding<"color">;
};

export const iconComponent = defineRegistryComponent<IconComponentOptions>()({
  id: "icon",
  name: "Icon",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    size: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    color: {
      kind: "scale",
      type: "color",
      description: "Scale used by the color prop.",
    },
  },
  output: vanillaExtractComponentOutput("icon", "Icon", (scales) =>
    generateIconSources({ size: scales.size!, color: scales.color! }),
  ),
});
