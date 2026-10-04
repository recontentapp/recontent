import type { ComponentSourceFiles, TokenImport } from "../types.js";
import { focusRingBlock, typographyProps } from "./shared.js";
import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../define.js";
import { vanillaExtractComponentOutput } from "./shared.js";

// Inset kept identical on both edges of the track, in both the checked and unchecked state.
const THUMB_OFFSET = "2px";

function generateSwitchSources(bindings: {
  trackWidth: TokenImport;
  trackHeight: TokenImport;
  thumbSize: TokenImport;
  borderRadius: TokenImport;
  trackBackgroundColor: TokenImport;
  trackCheckedBackgroundColor: TokenImport;
  trackBorder: TokenImport;
  thumbBackgroundColor: TokenImport;
  thumbShadow: TokenImport;
  focusRingColor: TokenImport | undefined;
  disabledTrackBackgroundColor: TokenImport;
  labelTypography: TokenImport;
  labelColor: TokenImport;
  gap: TokenImport;
  transition: TokenImport;
}): ComponentSourceFiles {
  const {
    trackWidth,
    trackHeight,
    thumbSize,
    borderRadius,
    trackBackgroundColor,
    trackCheckedBackgroundColor,
    trackBorder,
    thumbBackgroundColor,
    thumbShadow,
    focusRingColor,
    disabledTrackBackgroundColor,
    labelTypography,
    labelColor,
    gap,
    transition,
  } = bindings;

  return {
    styles: `import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const switchRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  cursor: "pointer",
  gap: ${gap.reference},
  selectors: {
    "&[data-disabled]": {
      cursor: "not-allowed",
    },
  },
});

export const switchRootLabelPosition = styleVariants({
  start: { flexDirection: "row-reverse" },
  end: { flexDirection: "row" },
});

export const switchTrack = style({
  boxSizing: "border-box",
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  width: ${trackWidth.reference},
  height: ${trackHeight.reference},
  border: ${trackBorder.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${trackBackgroundColor.reference},
  transitionProperty: "background-color",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&[data-checked]": {
      backgroundColor: ${trackCheckedBackgroundColor.reference},
    },
    "&[data-disabled]": {
      backgroundColor: ${disabledTrackBackgroundColor.reference},
      cursor: "not-allowed",
    },
  },
});

export const switchThumb = style({
  boxSizing: "border-box",
  position: "absolute",
  top: "50%",
  left: ${JSON.stringify(THUMB_OFFSET)},
  translate: "0 -50%",
  width: ${thumbSize.reference},
  height: ${thumbSize.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${thumbBackgroundColor.reference},
  boxShadow: ${thumbShadow.reference},
  transitionProperty: "left",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  selectors: {
    "[data-checked] > &": {
      left: \`calc(100% - \${${thumbSize.reference}} - ${THUMB_OFFSET})\`,
    },
  },
});

export const switchLabel = style({
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference, "      ")},
});
`,
    component: `import type { ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  switchLabel,
  switchRoot,
  switchRootLabelPosition,
  switchThumb,
  switchTrack,
} from "./Switch.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";

export interface SwitchProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  labelPosition?: "start" | "end";
  render?: RenderProp<"button">;
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelPosition = "end",
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: SwitchProps) {
  const classes = [switchRoot, switchRootLabelPosition[labelPosition], className]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes} data-disabled={disabled || undefined} data-slot="switch">
      <BaseSwitch.Root
        {...props}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => onCheckedChange?.(next)}
        name={name}
        disabled={disabled}
        required={required}
        onFocus={onFocus}
        onBlur={onBlur}
        data-invalid={invalid || undefined}
        render={render}
        className={switchTrack}
      >
        <BaseSwitch.Thumb className={switchThumb} />
      </BaseSwitch.Root>
      {label !== undefined && <span className={switchLabel}>{label}</span>}
    </label>
  );
}
`,
  };
}

export type SwitchComponentOptions = {
  trackWidth: TokenBinding<"dimension">;
  trackHeight: TokenBinding<"dimension">;
  thumbSize: TokenBinding<"dimension">;
  borderRadius: TokenBinding<"dimension">;
  trackBackgroundColor: TokenBinding<"color">;
  trackCheckedBackgroundColor: TokenBinding<"color">;
  trackBorder: TokenBinding<"border">;
  thumbBackgroundColor: TokenBinding<"color">;
  thumbShadow: TokenBinding<"shadow">;
  disabledTrackBackgroundColor: TokenBinding<"color">;
  labelTypography: TokenBinding<"typography">;
  labelColor: TokenBinding<"color">;
  gap: TokenBinding<"dimension">;
  transition: TokenBinding<"transition">;
};

export const switchComponent = defineRegistryComponent<SwitchComponentOptions>()({
  id: "switch",
  name: "Switch",
  internalDependencies: ["render-element"],
  schema: {
    trackWidth: { kind: "token", type: "dimension", description: "Width of the track." },
    trackHeight: { kind: "token", type: "dimension", description: "Height of the track." },
    thumbSize: { kind: "token", type: "dimension", description: "Width and height of the thumb." },
    borderRadius: {
      kind: "token",
      type: "dimension",
      description: "Corner radius applied to the track and thumb.",
    },
    trackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when off.",
    },
    trackCheckedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when on.",
    },
    trackBorder: {
      kind: "token",
      type: "border",
      description: "Border applied around the track.",
    },
    thumbBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the thumb.",
    },
    thumbShadow: {
      kind: "token",
      type: "shadow",
      description: "Shadow applied to the thumb.",
    },
    disabledTrackBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the track when disabled.",
    },
    labelTypography: {
      kind: "token",
      type: "typography",
      description: "Typography applied to the label.",
    },
    labelColor: {
      kind: "token",
      type: "color",
      description: "Text color of the label.",
    },
    gap: {
      kind: "token",
      type: "dimension",
      description: "Space between the track and the label.",
    },
    transition: {
      kind: "token",
      type: "transition",
      description: "Transition of the thumb's slide.",
    },
  },
  output: vanillaExtractComponentOutput(
    "switch",
    "Switch",
    (_scales, _breakpoints, tokens, focusRingColor) =>
      generateSwitchSources({
        trackWidth: tokens.trackWidth!,
        trackHeight: tokens.trackHeight!,
        thumbSize: tokens.thumbSize!,
        borderRadius: tokens.borderRadius!,
        trackBackgroundColor: tokens.trackBackgroundColor!,
        trackCheckedBackgroundColor: tokens.trackCheckedBackgroundColor!,
        trackBorder: tokens.trackBorder!,
        thumbBackgroundColor: tokens.thumbBackgroundColor!,
        thumbShadow: tokens.thumbShadow!,
        focusRingColor,
        disabledTrackBackgroundColor: tokens.disabledTrackBackgroundColor!,
        labelTypography: tokens.labelTypography!,
        labelColor: tokens.labelColor!,
        gap: tokens.gap!,
        transition: tokens.transition!,
      }),
    { "@base-ui/react": "^1.0.0" },
  ),
});
