import type { ComponentSourceFiles, ScaleImport, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n  ");
}

export function generateRadioListSources(bindings: {
  sizes: ScaleImport;
  border: TokenImport;
  backgroundColor: TokenImport;
  checkedBorderColor: TokenImport;
  checkedColor: TokenImport;
  hoverBorderColor: TokenImport;
  focusRingColor: TokenImport | undefined;
  invalidBorderColor: TokenImport;
  disabledBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  labelTypography: TokenImport;
  labelColor: TokenImport;
  descriptionTypography: TokenImport;
  descriptionColor: TokenImport;
  gap: TokenImport;
  optionGap: TokenImport;
}): ComponentSourceFiles {
  const {
    sizes,
    border,
    backgroundColor,
    checkedBorderColor,
    checkedColor,
    hoverBorderColor,
    focusRingColor,
    invalidBorderColor,
    disabledBackgroundColor,
    disabledColor,
    labelTypography,
    labelColor,
    descriptionTypography,
    descriptionColor,
    gap,
    optionGap,
  } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { ${sizes.exportName} } from "../../tokens.css";
import { vars } from "../../tokens.css";

export const radioListRoot = style({
  display: "flex",
  boxSizing: "border-box",
  gap: ${optionGap.reference},
});

export const radioListRootOrientation = styleVariants({
  horizontal: { flexDirection: "row", flexWrap: "wrap" },
  vertical: { flexDirection: "column" },
});

export const radioListOption = style({
  display: "flex",
  alignItems: "flex-start",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: ${gap.reference},
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const radioListControl = style({
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "1rem",
  height: "1rem",
  marginTop: "0.125em",
  borderRadius: "50%",
  border: ${border.reference},
  backgroundColor: ${backgroundColor.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-checked]": {
      borderColor: ${checkedBorderColor.reference},
    },
    "&[data-invalid]": {
      borderColor: ${invalidBorderColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledBackgroundColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const radioListControlSize = styleVariants(${sizes.exportName}, (value) => ({
  width: value,
  height: value,
}));

export const radioListIndicator = style({
  width: "50%",
  height: "50%",
  borderRadius: "50%",
  backgroundColor: ${checkedColor.reference},
  selectors: {
    "[data-disabled] &": {
      backgroundColor: ${disabledColor.reference},
    },
  },
});

export const radioListContent = style({
  display: "flex",
  flexDirection: "column",
});

export const radioListLabel = style({
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference)},
});

export const radioListDescription = style({
  color: ${descriptionColor.reference},
  ${typographyProps(descriptionTypography.reference)},
});
`,
    component: `import type { ReactNode } from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import {
  radioListContent,
  radioListControl,
  radioListControlSize,
  radioListDescription,
  radioListIndicator,
  radioListLabel,
  radioListOption,
  radioListRoot,
  radioListRootOrientation,
} from "./RadioList.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";
import type { ${sizes.typeName} as RadioListSizeToken } from "../../tokens.css";

export interface RadioListOption<Value extends string> {
  value: Value;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioListProps<Value extends string>
  extends CommonComponentProps, FieldableInputProps {
  options: RadioListOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  orientation?: "horizontal" | "vertical";
  size?: RadioListSizeToken;
  render?: RenderProp<"div">;
}

export function RadioList<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  orientation = "vertical",
  size,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: RadioListProps<Value>) {
  const classes = [radioListRoot, radioListRootOrientation[orientation], className]
    .filter(Boolean)
    .join(" ");

  return (
    <BaseRadioGroup
      {...props}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => onValueChange?.(next as Value)}
      name={name}
      disabled={disabled}
      required={required}
      render={render}
      className={classes}
      data-slot="radio-list"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={radioListOption}
          data-disabled={disabled || option.disabled || undefined}
        >
          <BaseRadio.Root
            value={option.value}
            disabled={disabled || option.disabled}
            onFocus={onFocus}
            onBlur={onBlur}
            data-invalid={invalid || undefined}
            className={[radioListControl, size !== undefined && radioListControlSize[size]]
              .filter(Boolean)
              .join(" ")}
          >
            <BaseRadio.Indicator className={radioListIndicator} keepMounted={false} />
          </BaseRadio.Root>
          <div className={radioListContent}>
            <span className={radioListLabel}>{option.label}</span>
            {option.description !== undefined && (
              <span className={radioListDescription}>{option.description}</span>
            )}
          </div>
        </label>
      ))}
    </BaseRadioGroup>
  );
}
`,
  };
}
