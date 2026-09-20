import type { ComponentSourceFiles, TokenImport } from "../types.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { typographyProps, vanillaExtractComponentOutput } from "./shared.js";
function generateTextareaSources(bindings: {
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
  counterTypography: TokenImport;
  counterColor: TokenImport;
  counterExceededColor: TokenImport;
  counterGap: TokenImport;
  resizeHandleColor: TokenImport;
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
    hoverBorderColor,
    focusBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    readOnlyBackgroundColor,
    counterTypography,
    counterColor,
    counterExceededColor,
    counterGap,
    resizeHandleColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const textareaRoot = style({
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  width: "100%",
  gap: ${counterGap.reference},
});

export const textareaField = style({
  boxSizing: "border-box",
  width: "100%",
  resize: "vertical",
  color: ${color.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference, "      ")},
  accentColor: ${resizeHandleColor.reference},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-visible": {
    borderColor: ${focusBorderColor.reference},
    ${focusRingColor ? `outline: "none",\n    boxShadow: \`0 0 0 2px \${${focusRingColor.reference}}\`,` : ""}
  },
  selectors: {
    "&[data-auto-resize]": {
      resize: "none",
    },
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[readonly]": {
      backgroundColor: ${readOnlyBackgroundColor.reference},
    },
    "&:disabled": {
      backgroundColor: ${disabledBackgroundColor.reference},
      color: ${disabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const textareaCounter = style({
  alignSelf: "flex-end",
  boxSizing: "border-box",
  color: ${counterColor.reference},
  ${typographyProps(counterTypography.reference, "      ")},
  selectors: {
    "&[data-exceeded]": {
      color: ${counterExceededColor.reference},
    },
  },
});

`,
    component: `import { useState, type ChangeEventHandler, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { textareaCounter, textareaField, textareaRoot } from "./Textarea.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";

export interface TextareaProps extends CommonComponentProps, FieldableInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  showCharacterCount?: boolean;
  maxLength?: number;
  render?: RenderProp<"textarea">;
}

export function Textarea({
  value,
  defaultValue,
  onChange,
  placeholder,
  readOnly = false,
  autoFocus = false,
  autoResize = false,
  minRows = 3,
  maxRows,
  showCharacterCount = false,
  maxLength,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: TextareaProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? (value ?? "") : uncontrolledValue;

  const style: CSSProperties = autoResize
    ? {
        fieldSizing: "content" as never,
        minHeight: \`calc(\${minRows} * 1.5em)\`,
        maxHeight: maxRows !== undefined ? \`calc(\${maxRows} * 1.5em)\` : undefined,
      }
    : { minHeight: \`calc(\${minRows} * 1.5em)\` };

  const fieldProps: Record<string, unknown> = {
    ...props,
    value,
    defaultValue,
    onChange: (event: Parameters<ChangeEventHandler<HTMLTextAreaElement>>[0]) => {
      if (!isControlled) setUncontrolledValue(event.target.value);
      onChange?.(event);
    },
    placeholder,
    readOnly,
    autoFocus,
    maxLength,
    rows: minRows,
    name,
    disabled,
    required,
    onFocus,
    onBlur,
    "data-invalid": invalid || undefined,
    "data-auto-resize": autoResize || undefined,
    style,
    className: textareaField,
  };

  return (
    <div className={textareaRoot} data-slot="textarea">
      {renderElement("textarea", render, fieldProps as ComponentPropsWithoutRef<"textarea">)}
      {showCharacterCount && (
        <span
          className={textareaCounter}
          data-exceeded={(maxLength !== undefined && currentValue.length > maxLength) || undefined}
        >
          {currentValue.length}
          {maxLength !== undefined ? \`/\${maxLength}\` : ""}
        </span>
      )}
    </div>
  );
}
`,
  };
}

export type TextareaComponentOptions = {
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
  // Textarea-specific.
  counterTypography: TokenBinding<"typography">;
  counterColor: TokenBinding<"color">;
  counterExceededColor: TokenBinding<"color">;
  counterGap: TokenBinding<"dimension">;
  resizeHandleColor: TokenBinding<"color">;
};

export const textareaComponent = defineRegistryComponent<TextareaComponentOptions>()({
  id: "textarea",
  name: "Textarea",
  internalDependencies: ["render-element"],
  schema: {
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius of the textarea.",
    },
    border: { kind: "token", type: "border", description: "Border applied around the textarea." },
    backgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea.",
    },
    color: { kind: "token", type: "color", description: "Text color of the textarea." },
    typography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the textarea.",
    },
    placeholderColor: {
      kind: "token",
      type: "color",
      description: "Text color of the placeholder.",
    },
    horizontalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Left/right padding of the textarea.",
    },
    verticalSpacing: {
      kind: "token",
      type: "dimension",
      description: "Top/bottom padding of the textarea.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the field and its counter.",
    },
    hoverBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea on hover.",
    },
    focusBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea on focus.",
    },
    invalidBorderColor: {
      kind: "token",
      type: "color",
      description: "Border color of the textarea when invalid.",
    },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea when disabled.",
    },
    disabledColor: {
      kind: "token",
      type: "color",
      description: "Text color of the textarea when disabled.",
    },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the textarea when read-only.",
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
    counterTypography: {
      kind: "token",
      type: "typography",
      description: "Typography of the character counter.",
    },
    counterColor: {
      kind: "token",
      type: "color",
      description: "Text color of the character counter.",
    },
    counterExceededColor: {
      kind: "token",
      type: "color",
      description: "Text color of the counter once maxLength is exceeded.",
    },
    counterGap: {
      kind: "token",
      type: "dimension",
      description: "Space above the character counter.",
    },
    resizeHandleColor: { kind: "token", type: "color", description: "Color of the resize handle." },
  },
  output: vanillaExtractComponentOutput(
    "textarea",
    "Textarea",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateTextareaSources({
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
        counterTypography: tokens.counterTypography!,
        counterColor: tokens.counterColor!,
        counterExceededColor: tokens.counterExceededColor!,
        counterGap: tokens.counterGap!,
        resizeHandleColor: tokens.resizeHandleColor!,
      }),
  ),
});
