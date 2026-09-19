import type { ComponentSourceFiles, TokenImport } from "../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateFieldSources(bindings: {
  labelTypography: TokenImport;
  labelColor: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  errorTypography: TokenImport;
  errorColor: TokenImport;
  requiredIndicatorColor: TokenImport;
  optionalTypography: TokenImport;
  optionalColor: TokenImport;
  gap: TokenImport;
  iconSize: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  errorIcon: string;
}): ComponentSourceFiles {
  const {
    labelTypography,
    labelColor,
    descriptionTypography,
    descriptionColor,
    errorTypography,
    errorColor,
    requiredIndicatorColor,
    optionalTypography,
    optionalColor,
    gap,
    iconSize,
    errorIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const fieldRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  gap: ${gap.reference},
});

export const fieldLabelRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
});

export const fieldLabel = style({
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference)},
});

export const fieldRequiredIndicator = style({
  color: ${requiredIndicatorColor.reference},
});

export const fieldOptionalText = style({
  color: ${optionalColor.reference},
  ${typographyProps(optionalTypography.reference)},
});

export const fieldDescription = style({
  margin: 0,
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});

export const fieldErrorRow = style({
  display: "flex",
  alignItems: "center",
  gap: "0.25em",
  color: ${errorColor.reference},
  ${typographyProps(errorTypography.reference)},
});

export const fieldErrorIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});
`,
    component: `import type { ReactNode } from "react";
import { Field as BaseField } from "@base-ui/react/field";
import {
  fieldDescription,
  fieldErrorIcon,
  fieldErrorRow,
  fieldLabel,
  fieldLabelRow,
  fieldOptionalText,
  fieldRequiredIndicator,
  fieldRoot,
} from "./Field.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const ErrorIcon = icons[${JSON.stringify(errorIcon)}];

export interface FieldProps extends CommonComponentProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Shown next to the label when the field is not required. */
  optionalText?: ReactNode;
  children: ReactNode;
  render?: RenderProp<"div">;
}

export function Field({
  label,
  description,
  error,
  required = false,
  optionalText,
  className,
  render,
  children,
  ...props
}: FieldProps) {
  const classes = [fieldRoot, className].filter(Boolean).join(" ");

  return (
    <BaseField.Root
      {...props}
      invalid={error !== undefined}
      render={render}
      className={classes}
      data-slot="field"
    >
      {(label !== undefined || (!required && optionalText !== undefined)) && (
        <span className={fieldLabelRow}>
          {label !== undefined && (
            <BaseField.Label className={fieldLabel}>
              {label}
              {required && <span className={fieldRequiredIndicator}>*</span>}
            </BaseField.Label>
          )}
          {!required && optionalText !== undefined && (
            <span className={fieldOptionalText}>{optionalText}</span>
          )}
        </span>
      )}
      {children}
      {description !== undefined && (
        <BaseField.Description className={fieldDescription}>{description}</BaseField.Description>
      )}
      {error !== undefined && (
        <BaseField.Error className={fieldErrorRow} match={true}>
          <ErrorIcon className={fieldErrorIcon} aria-hidden="true" />
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type FieldComponentOptions = {
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  descriptionTypography: TokenBinding<"typography">;
  descriptionColor: TokenBinding<"color">;
  errorTypography: TokenBinding<"typography">;
  errorColor: TokenBinding<"color">;
  requiredIndicatorColor: TokenBinding<"color">;
  optionalTypography: TokenBinding<"typography">;
  optionalColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
  errorIcon: IconName;
};

export const fieldComponent = defineRegistryComponent<FieldComponentOptions>()({
  id: "field",
  name: "Field",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
    },
    labelColor: { kind: "token", type: "color", description: "Text color of the label." },
    descriptionTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the description.",
    },
    descriptionColor: {
      kind: "token",
      type: "color",
      description: "Text color of the description.",
    },
    errorTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the error text.",
    },
    errorColor: { kind: "token", type: "color", description: "Text color of the error text." },
    requiredIndicatorColor: {
      kind: "token",
      type: "color",
      description: "Color of the required indicator next to the label.",
    },
    optionalTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the optional text next to the label.",
    },
    optionalColor: {
      kind: "token",
      type: "color",
      description: "Text color of the optional text.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the label, control and helper text.",
    },
    iconSize: { kind: "token", type: "dimension", description: "Size of the error icon." },
    errorIcon: { kind: "icon", description: "Icon rendered next to the error text." },
  },
  output: vanillaExtractComponentOutput(
    "field",
    "Field",
    (_scales, _breakpoints, tokens, _focusRingColor, icons) =>
      generateFieldSources({
        labelTypography: tokens.labelTypography!,
        labelColor: tokens.labelColor!,
        descriptionTypography: tokens.descriptionTypography!,
        descriptionColor: tokens.descriptionColor!,
        errorTypography: tokens.errorTypography!,
        errorColor: tokens.errorColor!,
        requiredIndicatorColor: tokens.requiredIndicatorColor!,
        optionalTypography: tokens.optionalTypography!,
        optionalColor: tokens.optionalColor!,
        gap: tokens.gap!,
        iconSize: tokens.iconSize!,
        errorIcon: icons.errorIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
