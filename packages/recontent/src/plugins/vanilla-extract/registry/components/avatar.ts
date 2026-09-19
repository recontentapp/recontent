import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../types.js";
import type { ScaleBinding, TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { typographyProps, vanillaExtractComponentOutput } from "./shared.js";
function generateAvatarSources(bindings: {
  sizes: ScaleImport;
  color: TokenImport;
  backgroundColor: TokenImport;
  borderRadius: TokenImport;
  typography: TokenImport;
}): ComponentSourceFiles {
  const { sizes, color, backgroundColor, borderRadius, typography } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${sizes.exportName}, vars } from "../../tokens.css";

export const avatarRoot = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  overflow: "hidden",
  flexShrink: 0,
  backgroundColor: ${backgroundColor.reference},
  borderRadius: "9999px",
});

export const avatarSize = styleVariants(${sizes.exportName}, (value) => ({
  width: value,
  height: value,
}));

export const avatarShapeSquare = style({
  borderRadius: ${borderRadius.reference},
});

export const avatarImage = style({
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

export const avatarFallback = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: ${color.reference},
  ${typographyProps(typography.reference, "    ")},
});
`,
    component: `import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import {
  avatarFallback,
  avatarImage,
  avatarRoot,
  avatarShapeSquare,
  avatarSize,
} from "./Avatar.gen.css";
import type { ${sizes.typeName} as AvatarSizeToken } from "../../tokens.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export interface AvatarProps extends CommonComponentProps {
  src?: string;
  alt?: string;
  text?: string;
  size?: AvatarSizeToken;
  shape?: "circle" | "square";
  render?: RenderProp<"span">;
}

export function Avatar({
  src,
  alt,
  text,
  size,
  shape = "circle",
  className,
  render,
  ...props
}: AvatarProps) {
  const classes = [
    avatarRoot,
    size !== undefined && avatarSize[size],
    shape === "square" && avatarShapeSquare,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseAvatar.Root {...props} render={render} className={classes} data-slot="avatar">
      {src && <BaseAvatar.Image src={src} alt={alt} className={avatarImage} />}
      <BaseAvatar.Fallback className={avatarFallback}>{text}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
`,
  };
}

export type AvatarComponentOptions = {
  sizes: ScaleBinding<"dimension">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  borderRadius: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export const avatarComponent = defineRegistryComponent<AvatarComponentOptions>()({
  id: "avatar",
  name: "Avatar",
  internalDependencies: ["render-element"],
  schema: {
    sizes: {
      kind: "scale",
      type: "dimension",
      description: "Scale used by the size prop.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Fallback text color.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Fallback background color.",
    },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: 'Corner radius applied when shape is "square".',
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography used by the fallback text.",
    },
  },
  output: vanillaExtractComponentOutput(
    "avatar",
    "Avatar",
    (scales, _breakpoints, tokens) =>
      generateAvatarSources({
        sizes: scales.sizes!,
        color: tokens.color!,
        backgroundColor: tokens.backgroundColor!,
        borderRadius: tokens.borderRadius!,
        typography: tokens.typography!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
