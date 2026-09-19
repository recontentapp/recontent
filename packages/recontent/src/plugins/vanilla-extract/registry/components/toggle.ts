import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, groupVariantTokens } from "./shared.js";

const SIZE_FIELDS = ["horizontalSpacing", "verticalSpacing", "typography"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function sizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      ${typographyProps(fields.typography!.reference)},
    }`;
}

function generateToggleSources(bindings: {
  borderRadius: TokenImport;
  optionBorderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  hoverColor: TokenImport;
  activeColor: TokenImport;
  activeBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  tokens: Record<string, TokenImport>;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    borderRadius,
    optionBorderRadius,
    border,
    backgroundColor,
    color,
    typography,
    hoverColor,
    activeColor,
    activeBackgroundColor,
    disabledColor,
    tokens,
    focusRingColor,
  } = bindings;
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const sizeNames = Object.keys(sizes);

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const toggleRoot = style({
  display: "inline-flex",
  boxSizing: "border-box",
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
});

export const toggleOption = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: ${color.reference},
  borderRadius: ${optionBorderRadius.reference},
  ${typographyProps(typography.reference)},
  ":hover": {
    color: ${hoverColor.reference},
  },
  selectors: {
    "&[data-pressed]": {
      color: ${activeColor.reference},
      backgroundColor: ${activeBackgroundColor.reference},
    },
    "&[data-pressed]:hover": {
      color: ${activeColor.reference},
    },
    "&[data-disabled]": {
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
  ${focusRingBlock(focusRingColor)}
});

export const toggleOptionSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeStyleBody(sizes[name]!)},`).join("\n")}
});
`,
    component: `import type { ReactNode } from "react";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { toggleOption, toggleOptionSize, toggleRoot } from "./Toggle.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";

export type ToggleSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface ToggleOption<Value extends string> {
  value: Value;
  label: ReactNode;
}

export interface ToggleProps<Value extends string> extends CommonComponentProps {
  options: readonly [ToggleOption<Value>, ToggleOption<Value>];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  disabled?: boolean;
  size?: ToggleSize;
  render?: RenderProp<"div">;
}

export function Toggle<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
  className,
  render,
  ...props
}: ToggleProps<Value>) {
  const classes = [toggleRoot, className].filter(Boolean).join(" ");

  return (
    <BaseToggleGroup
      {...props}
      value={value !== undefined ? [value] : undefined}
      defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
      onValueChange={(groupValue) => onValueChange?.(groupValue[0] as Value)}
      disabled={disabled}
      multiple={false}
      render={render}
      className={classes}
      data-slot="toggle"
    >
      {options.map((option) => (
        <BaseToggle
          key={option.value}
          value={option.value}
          className={[toggleOption, toggleOptionSize[size]].join(" ")}
        >
          {option.label}
        </BaseToggle>
      ))}
    </BaseToggleGroup>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

type ToggleSizeFields = {
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  typography: TokenBinding<"typography">;
};

export type ToggleComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  optionBorderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  sizes: Record<string, ToggleSizeFields>;
};

export const toggleComponent = defineRegistryComponent<ToggleComponentOptions>()({
  id: "toggle",
  name: "Toggle",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the outer track.",
    },
    optionBorderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of each option.",
    },
    border: {
      kind: "token",
      type: "border",
      description: "Border applied around the outer track.",
    },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the outer track.",
    },
    color: {
      kind: "token",
      type: "color",
      description: "Text color of an unselected option.",
    },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to option labels.",
    },
    hoverColor: {
      kind: "token",
      type: "color",
      description: "Text color of an unselected option on hover.",
    },
    activeColor: {
      kind: "token",
      type: "color",
      description: "Text color of the selected option.",
    },
    activeBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected option.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of a disabled option.",
    },
    sizes: {
      kind: "variants",
      description: "Consumer-defined sizes, drives the size prop.",
      fields: {
        horizontalSpacing: { kind: "token", type: "dimension" },
        verticalSpacing: { kind: "token", type: "dimension" },
        typography: { kind: "token", type: "typography" },
      },
    },
  },
  output: vanillaExtractComponentOutput(
    "toggle",
    "Toggle",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateToggleSources({
        borderRadius: tokens.borderRadius!,
        optionBorderRadius: tokens.optionBorderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        hoverColor: tokens.hoverColor!,
        activeColor: tokens.activeColor!,
        activeBackgroundColor: tokens.activeBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        tokens,
        focusRingColor,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
