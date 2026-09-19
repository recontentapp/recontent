import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";
function generateSegmentedControlsSources(bindings: {
  borderRadius: TokenImport;
  optionBorderRadius: TokenImport;
  border: TokenImport;
  borderColor: TokenImport;
  typography: TokenImport;
  color: TokenImport;
  backgroundColor: TokenImport;
  hoverColor: TokenImport;
  activeColor: TokenImport;
  activeBackgroundColor: TokenImport;
  disabledColor: TokenImport;
  horizontalSpacing: TokenImport;
  verticalSpacing: TokenImport;
  optionHorizontalSpacing: TokenImport;
  optionVerticalSpacing: TokenImport;
  optionGap: TokenImport;
  iconSize: TokenImport;
  focusRingColor: TokenImport | undefined;
}): ComponentSourceFiles {
  const {
    borderRadius,
    optionBorderRadius,
    border,
    borderColor,
    typography,
    color,
    backgroundColor,
    hoverColor,
    activeColor,
    activeBackgroundColor,
    disabledColor,
    horizontalSpacing,
    verticalSpacing,
    optionHorizontalSpacing,
    optionVerticalSpacing,
    optionGap,
    iconSize,
    focusRingColor,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const segmentedControlsRoot = style({
  display: "inline-flex",
  boxSizing: "border-box",
  border: ${border.reference},
  borderColor: ${borderColor.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
});

export const segmentedControlsOption = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  border: "none",
  backgroundColor: "transparent",
  color: ${color.reference},
  borderRadius: ${optionBorderRadius.reference},
  gap: ${optionGap.reference},
  paddingLeft: ${optionHorizontalSpacing.reference},
  paddingRight: ${optionHorizontalSpacing.reference},
  paddingTop: ${optionVerticalSpacing.reference},
  paddingBottom: ${optionVerticalSpacing.reference},
  ${typographyProps(typography.reference, "  ")},
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

export const segmentedControlsOptionIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});
`,
    component: `import type { CSSProperties, ReactNode } from "react";
import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import {
  segmentedControlsOption,
  segmentedControlsOptionIcon,
  segmentedControlsRoot,
} from "./SegmentedControls.gen.css";
import type { CommonComponentProps, RenderProp } from "../../renderElement.gen";
import { icons, type IconType } from "../../iconMap";

/** Structural sizing, not covered by tokens. */
export type Width = "100%" | "auto" | number | (string & {});

export interface SegmentedControlsOption<Value extends string> {
  value: Value;
  label: ReactNode;
  icon?: IconType;
  disabled?: boolean;
}

export interface SegmentedControlsProps<Value extends string> extends CommonComponentProps {
  options: SegmentedControlsOption<Value>[];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (value: Value) => void;
  disabled?: boolean;
  width?: Width;
  render?: RenderProp<"div">;
}

export function SegmentedControls<Value extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  width,
  className,
  render,
  ...props
}: SegmentedControlsProps<Value>) {
  const classes = [segmentedControlsRoot, className].filter(Boolean).join(" ");
  const style: CSSProperties = { width };

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
      style={style}
      data-slot="segmented-controls"
    >
      {options.map((option) => {
        const OptionIcon = option.icon ? icons[option.icon] : undefined;
        return (
          <BaseToggle
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={segmentedControlsOption}
          >
            {OptionIcon && <OptionIcon className={segmentedControlsOptionIcon} aria-hidden="true" />}
            {option.label}
          </BaseToggle>
        );
      })}
    </BaseToggleGroup>
  );
}
`,
  };
}

export type SegmentedControlsComponentOptions = {
  borderRadius: TokenBinding<"dimension">;
  optionBorderRadius: TokenBinding<"dimension">;
  border: TokenBinding<"border">;
  borderColor: TokenBinding<"color">;
  typography: TokenBinding<"typography">;
  color: TokenBinding<"color">;
  backgroundColor: TokenBinding<"color">;
  hoverColor: TokenBinding<"color">;
  activeColor: TokenBinding<"color">;
  activeBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  horizontalSpacing: TokenBinding<"dimension">;
  verticalSpacing: TokenBinding<"dimension">;
  optionHorizontalSpacing: TokenBinding<"dimension">;
  optionVerticalSpacing: TokenBinding<"dimension">;
  optionGap: TokenBinding<"dimension">;
  iconSize: TokenBinding<"dimension">;
};

export const segmentedControlsComponent =
  defineRegistryComponent<SegmentedControlsComponentOptions>()({
    id: "segmented-controls",
    name: "SegmentedControls",
    internalDependencies: ["render-element", "icon-map"],
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
      borderColor: {
        kind: "token",
        type: "color",
        description: "Color of the outer track's border, overriding the border's own color.",
      },
      typography: {
        kind: "token",
        type: "typography",
        description: "Typography applied to option labels.",
      },
      color: {
        kind: "token",
        type: "color",
        description: "Text color of an unselected option.",
      },
      backgroundColor: {
        kind: "token",
        type: "color",
        description: "Background color of the outer track.",
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
      horizontalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Left/right padding of the outer track.",
      },
      verticalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Top/bottom padding of the outer track.",
      },
      optionHorizontalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Left/right padding of each option.",
      },
      optionVerticalSpacing: {
        kind: "token",
        type: "dimension",
        description: "Top/bottom padding of each option.",
      },
      optionGap: {
        kind: "token",
        type: "dimension",
        description: "Space between an option's icon and label.",
      },
      iconSize: {
        kind: "token",
        type: "dimension",
        description: "Size of an option's icon.",
      },
    },
    output: vanillaExtractComponentOutput(
      "segmented-controls",
      "SegmentedControls",
      (_scales, _breakpoints, tokens, focusRingColor) =>
        generateSegmentedControlsSources({
          borderRadius: tokens.borderRadius!,
          optionBorderRadius: tokens.optionBorderRadius!,
          border: tokens.border!,
          borderColor: tokens.borderColor!,
          typography: tokens.typography!,
          color: tokens.color!,
          backgroundColor: tokens.backgroundColor!,
          hoverColor: tokens.hoverColor!,
          activeColor: tokens.activeColor!,
          activeBackgroundColor: tokens.activeBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          horizontalSpacing: tokens.horizontalSpacing!,
          verticalSpacing: tokens.verticalSpacing!,
          optionHorizontalSpacing: tokens.optionHorizontalSpacing!,
          optionVerticalSpacing: tokens.optionVerticalSpacing!,
          optionGap: tokens.optionGap!,
          iconSize: tokens.iconSize!,
          focusRingColor,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  });
