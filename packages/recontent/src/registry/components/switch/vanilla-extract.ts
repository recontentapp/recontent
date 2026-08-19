import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock, groupVariantTokens } from "../shared.js";

const SIZE_FIELDS = ["trackWidth", "trackHeight", "thumbSize"] as const;

function typographyProps(ref: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(",\n      ");
}

function sizeTrackStyleBody(fields: Record<string, TokenImport>): string {
  return `{ width: ${fields.trackWidth!.reference}, height: ${fields.trackHeight!.reference} }`;
}

function sizeThumbStyleBody(fields: Record<string, TokenImport>): string {
  return `{ width: ${fields.thumbSize!.reference}, height: ${fields.thumbSize!.reference} }`;
}

export function generateSwitchSources(bindings: {
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
  tokens: Record<string, TokenImport>;
}): ComponentSourceFiles {
  const {
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
    tokens,
  } = bindings;
  const sizes = groupVariantTokens(tokens, "sizes", SIZE_FIELDS);
  const sizeNames = Object.keys(sizes);

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

export const switchTrackSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeTrackStyleBody(sizes[name]!)},`).join("\n")}
});

export const switchThumb = style({
  boxSizing: "border-box",
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${thumbBackgroundColor.reference},
  boxShadow: ${thumbShadow.reference},
  transitionProperty: "translate",
  transitionDuration: ${transition.reference}.transitionDuration,
  transitionTimingFunction: ${transition.reference}.transitionTimingFunction,
  translate: "2px",
  selectors: {
    "[data-checked] > &": {
      translate: "calc(100% - 2px)",
    },
  },
});

export const switchThumbSize = styleVariants({
${sizeNames.map((name) => `  ${JSON.stringify(name)}: ${sizeThumbStyleBody(sizes[name]!)},`).join("\n")}
});

export const switchLabel = style({
  color: ${labelColor.reference},
  ${typographyProps(labelTypography.reference)},
});
`,
    component: `import type { ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import {
  switchLabel,
  switchRoot,
  switchRootLabelPosition,
  switchThumb,
  switchThumbSize,
  switchTrack,
  switchTrackSize,
} from "./Switch.gen.css";
import type { CommonComponentProps, FieldableInputProps, RenderProp } from "../../renderElement.gen";

export type SwitchSize = ${sizeNames.map((n) => JSON.stringify(n)).join(" | ")};

export interface SwitchProps extends CommonComponentProps, FieldableInputProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
  labelPosition?: "start" | "end";
  size?: SwitchSize;
  render?: RenderProp<"button">;
}

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  label,
  labelPosition = "end",
  size = ${JSON.stringify(sizeNames[0] ?? "md")},
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
        className={[switchTrack, switchTrackSize[size]].join(" ")}
      >
        <BaseSwitch.Thumb className={[switchThumb, switchThumbSize[size]].join(" ")} />
      </BaseSwitch.Root>
      {label !== undefined && <span className={switchLabel}>{label}</span>}
    </label>
  );
}
`,
  };
}
