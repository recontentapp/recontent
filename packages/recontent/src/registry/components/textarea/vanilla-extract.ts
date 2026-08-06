import type { ComponentSourceFiles, TokenImport } from "../../types.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

export function generateTextareaSources(bindings: {
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
  focusRingColor: TokenImport;
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
  ${typographyProps(typography.reference)},
  accentColor: ${resizeHandleColor.reference},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus": {
    borderColor: ${focusBorderColor.reference},
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
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
  ${typographyProps(counterTypography.reference)},
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
