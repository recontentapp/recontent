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

function generateNumberInputSources(bindings: {
  borderRadius: TokenImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  color: TokenImport;
  typography: TokenImport;
  placeholderColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  gap: TokenImport;
  hoverBorderColor: TokenImport;
  focusBorderColor: TokenImport;
  focusRingColor: TokenImport | undefined;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  readOnlyBackgroundColor: TokenImport;
  iconColor: TokenImport;
  iconSize: TokenImport;
  affixColor: TokenImport;
  affixBackgroundColor: TokenImport;
  stepperBackgroundColor: TokenImport;
  stepperColor: TokenImport;
  stepperHoverBackgroundColor: TokenImport;
  stepperBorder: TokenImport;
  stepperWidth: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  incrementIcon: string;
  decrementIcon: string;
}): ComponentSourceFiles {
  const {
    borderRadius,
    border,
    backgroundColor,
    color,
    typography,
    placeholderColor,
    horizontalSpacing,
    verticalSpacing,
    gap,
    hoverBorderColor,
    focusBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    readOnlyBackgroundColor,
    iconSize,
    affixColor,
    affixBackgroundColor,
    stepperBackgroundColor,
    stepperColor,
    stepperHoverBackgroundColor,
    stepperBorder,
    stepperWidth,
    incrementIcon,
    decrementIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const numberInputGroup = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: ${gap.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-within": {
    borderColor: ${focusBorderColor.reference},
    ${focusRingColor ? `outline: "none", boxShadow: \`0 0 0 2px \${${focusRingColor.reference}}\`,` : ""}
  },
  selectors: {
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-readonly]": {
      backgroundColor: ${readOnlyBackgroundColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const numberInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  color: ${color.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
});

export const numberInputAffix = style({
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  color: ${affixColor.reference},
  backgroundColor: ${affixBackgroundColor.reference},
  ${typographyProps(typography.reference)},
});

export const numberInputStepper = style({
  display: "flex",
  flexDirection: "column",
  flexShrink: 0,
  alignSelf: "stretch",
  boxSizing: "border-box",
  borderLeft: ${stepperBorder.reference},
});

export const numberInputStepperButton = style({
  flex: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: ${stepperWidth.reference},
  cursor: "pointer",
  border: "none",
  backgroundColor: ${stepperBackgroundColor.reference},
  color: ${stepperColor.reference},
  ":hover": {
    backgroundColor: ${stepperHoverBackgroundColor.reference},
  },
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const numberInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const numberInputIncrementIcon = style({
  transform: "rotate(180deg)",
});
`,
    component: `import type { ReactNode } from "react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import {
  numberInputAffix,
  numberInputField,
  numberInputGroup,
  numberInputIcon,
  numberInputIncrementIcon,
  numberInputStepper,
  numberInputStepperButton,
} from "./NumberInput.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const IncrementIcon = icons[${JSON.stringify(incrementIcon)}];
const DecrementIcon = icons[${JSON.stringify(decrementIcon)}];

export interface NumberInputProps extends CommonComponentProps, FieldableInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  showStepper?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  render?: RenderProp<"input">;
}

export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step,
  largeStep,
  format,
  locale,
  showStepper = true,
  readOnly = false,
  placeholder,
  prefix,
  suffix,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: NumberInputProps) {
  const classes = [numberInputGroup, className].filter(Boolean).join(" ");

  return (
    <BaseNumberField.Root
      value={value}
      defaultValue={defaultValue ?? undefined}
      onValueChange={(next) => onValueChange?.(next)}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      format={format}
      locale={locale}
      readOnly={readOnly}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseNumberField.Group
        {...props}
        data-invalid={invalid || undefined}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
        className={classes}
        data-slot="number-input"
      >
        {prefix !== undefined && <span className={numberInputAffix}>{prefix}</span>}
        <BaseNumberField.Input
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          render={render}
          className={numberInputField}
        />
        {suffix !== undefined && <span className={numberInputAffix}>{suffix}</span>}
        {showStepper && (
          <span className={numberInputStepper}>
            <BaseNumberField.Increment className={numberInputStepperButton}>
              <IncrementIcon className={[numberInputIcon, numberInputIncrementIcon].join(" ")} aria-hidden="true" />
            </BaseNumberField.Increment>
            <BaseNumberField.Decrement className={numberInputStepperButton}>
              <DecrementIcon className={numberInputIcon} aria-hidden="true" />
            </BaseNumberField.Decrement>
          </span>
        )}
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
`,
  };
}

import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import type { IconName } from "../internal/icon-map-icons.js";
import { vanillaExtractComponentOutput } from "./shared.js";

export type NumberInputComponentOptions = {
  // Input surface, shared with TextInput.
  borderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  backgroundColor: TokenBinding<"color">;
  color: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  placeholderColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  gap: TokenBinding<"dimension">;
  hoverBorderColor: TokenBinding<"color">;
  focusBorderColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  readOnlyBackgroundColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  affixColor: TokenBinding<"color">;
  affixBackgroundColor: TokenBinding<"color">;
  // NumberInput-specific.
  stepperBackgroundColor: TokenBinding<"color">;
  stepperColor: TokenBinding<"color">;
  stepperHoverBackgroundColor: TokenBinding<"color">;
  stepperBorder: TokenBinding<"border">;
  stepperWidth: TokenBinding<"dimension">;
  incrementIcon: IconName;
  decrementIcon: IconName;
};

export const numberInputComponent = defineRegistryComponent<NumberInputComponentOptions>()({
  id: "number-input",
  name: "NumberInput",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of the input." },
    border: { kind: "token", type: "border", description: "Border applied around the input." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input.",
    },
    color: { kind: "token", type: "color", description: "Text color of the input." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the input.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the input.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the input.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between affixes, icons and the field.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the input when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the input when disabled.",
    },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when read-only.",
    },
    iconColor: {
      kind: "token",
      type: "color",
      description: "Color of the leading/trailing icons.",
    },
    iconSize: {
      kind: "token",
      type: "dimension",
      description: "Size of the leading/trailing icons.",
    },
    affixColor: { kind: "token", type: "color", description: "Text color of the prefix/suffix." },
    affixBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the prefix/suffix.",
    },
    stepperBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a stepper button.",
    },
    stepperColor: { kind: "token", type: "color", description: "Icon color of a stepper button." },
    stepperHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a stepper button on hover.",
    },
    stepperBorder: {
      kind: "token",
      type: "border",
      description: "Border applied around the stepper group.",
    },
    stepperWidth: { kind: "token", type: "dimension", description: "Width of a stepper button." },
    incrementIcon: { kind: "icon", description: "Icon used by the increment stepper button." },
    decrementIcon: { kind: "icon", description: "Icon used by the decrement stepper button." },
  },
  output: vanillaExtractComponentOutput(
    "number-input",
    "NumberInput",
    (_scales, _breakpoints, tokens, focusRingColor, icons) =>
      generateNumberInputSources({
        borderRadius: tokens.borderRadius!,
        border: tokens.border!,
        backgroundColor: tokens.backgroundColor!,
        color: tokens.color!,
        typography: tokens.typography!,
        placeholderColor: tokens.placeholderColor!,
        horizontalSpacing: tokens.horizontalSpacing!,
        verticalSpacing: tokens.verticalSpacing!,
        gap: tokens.gap!,
        hoverBorderColor: tokens.hoverBorderColor!,
        focusBorderColor: tokens.focusBorderColor!,
        focusRingColor,
        invalidBorderColor: tokens.invalidBorderColor!,
        disabledBackgroundColor: tokens.disabledBackgroundColor!,
        disabledColor: tokens.disabledColor!,
        readOnlyBackgroundColor: tokens.readOnlyBackgroundColor!,
        iconColor: tokens.iconColor!,
        iconSize: tokens.iconSize!,
        affixColor: tokens.affixColor!,
        affixBackgroundColor: tokens.affixBackgroundColor!,
        stepperBackgroundColor: tokens.stepperBackgroundColor!,
        stepperColor: tokens.stepperColor!,
        stepperHoverBackgroundColor: tokens.stepperHoverBackgroundColor!,
        stepperBorder: tokens.stepperBorder!,
        stepperWidth: tokens.stepperWidth!,
        incrementIcon: icons.incrementIcon!,
        decrementIcon: icons.decrementIcon!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
