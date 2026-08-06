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

export function generateDateInputSources(bindings: {
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
  iconColor: TokenImport;
  iconSize: TokenImport;
  affixColor: TokenImport;
  affixBackgroundColor: TokenImport;
  popupBackgroundColor: TokenImport;
  popupBorder: TokenImport;
  popupBorderRadius: TokenImport;
  popupShadow: TokenImport;
  popupSpacing: TokenImport;
  popupOffset: TokenImport;
  dayTypography: TokenImport;
  dayColor: TokenImport;
  dayBorderRadius: TokenImport;
  dayHoverBackgroundColor: TokenImport;
  daySelectedBackgroundColor: TokenImport;
  daySelectedColor: TokenImport;
  dayTodayBorderColor: TokenImport;
  dayOutsideMonthColor: TokenImport;
  dayDisabledColor: TokenImport;
  weekdayTypography: TokenImport;
  weekdayColor: TokenImport;
  /** Build-time config, baked directly into the generated component. */
  calendarIcon: string;
  previousIcon: string;
  nextIcon: string;
  clearIcon: string;
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
    iconColor,
    iconSize,
    affixColor: _affixColor,
    affixBackgroundColor: _affixBackgroundColor,
    popupBackgroundColor,
    popupBorder,
    popupBorderRadius,
    popupShadow,
    popupSpacing,
    popupOffset,
    dayTypography,
    dayColor,
    dayBorderRadius,
    dayHoverBackgroundColor,
    daySelectedBackgroundColor,
    daySelectedColor,
    dayTodayBorderColor,
    dayOutsideMonthColor,
    dayDisabledColor,
    weekdayTypography,
    weekdayColor,
    calendarIcon,
    previousIcon,
    nextIcon,
    clearIcon,
  } = bindings;

  return {
    styles: `import { style } from "@vanilla-extract/css";
import { vars } from "../../tokens.css";

export const dateInputRoot = style({
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box",
  width: "100%",
  gap: ${gap.reference},
  border: ${border.reference},
  borderRadius: ${borderRadius.reference},
  backgroundColor: ${backgroundColor.reference},
  paddingLeft: ${horizontalSpacing.reference},
  paddingRight: ${horizontalSpacing.reference},
  ":hover": {
    borderColor: ${hoverBorderColor.reference},
  },
  ":focus-within": {
    borderColor: ${focusBorderColor.reference},
    outline: \`2px solid \${${focusRingColor.reference}}\`,
    outlineOffset: "2px",
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

export const dateInputField = style({
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

export const dateInputIconButton = style({
  display: "inline-flex",
  flexShrink: 0,
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: ${iconColor.reference},
});

export const dateInputIcon = style({
  display: "inline-flex",
  flexShrink: 0,
  width: ${iconSize.reference},
  height: ${iconSize.reference},
});

export const dateInputPositioner = style({
  outline: "none",
  zIndex: 50,
  selectors: {
    '&[data-side="top"]': { marginBottom: ${popupOffset.reference} },
    '&[data-side="bottom"]': { marginTop: ${popupOffset.reference} },
  },
});

export const dateInputPopup = style({
  boxSizing: "border-box",
  backgroundColor: ${popupBackgroundColor.reference},
  border: ${popupBorder.reference},
  borderRadius: ${popupBorderRadius.reference},
  boxShadow: ${popupShadow.reference},
  padding: ${popupSpacing.reference},
  outline: "none",
});

export const dateInputHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: ${popupSpacing.reference},
});

export const dateInputNavButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "none",
  background: "none",
  padding: 0,
  color: ${iconColor.reference},
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const dateInputMonthLabel = style({
  ${typographyProps(dayTypography.reference)},
  color: ${dayColor.reference},
});

export const dateInputGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.125rem",
});

export const dateInputWeekday = style({
  textAlign: "center",
  color: ${weekdayColor.reference},
  ${typographyProps(weekdayTypography.reference)},
});

export const dateInputDay = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  aspectRatio: "1",
  cursor: "pointer",
  border: "1px solid transparent",
  borderRadius: ${dayBorderRadius.reference},
  color: ${dayColor.reference},
  backgroundColor: "transparent",
  ${typographyProps(dayTypography.reference)},
  ":hover": {
    backgroundColor: ${dayHoverBackgroundColor.reference},
  },
  selectors: {
    "&[data-outside-month]": {
      color: ${dayOutsideMonthColor.reference},
    },
    "&[data-today]": {
      borderColor: ${dayTodayBorderColor.reference},
    },
    "&[data-selected]": {
      backgroundColor: ${daySelectedBackgroundColor.reference},
      color: ${daySelectedColor.reference},
    },
    "&:disabled": {
      color: ${dayDisabledColor.reference},
      cursor: "not-allowed",
    },
  },
});
`,
    component: `import { useState } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import {
  dateInputDay,
  dateInputField,
  dateInputGrid,
  dateInputHeader,
  dateInputIcon,
  dateInputIconButton,
  dateInputMonthLabel,
  dateInputNavButton,
  dateInputPopup,
  dateInputPositioner,
  dateInputRoot,
  dateInputWeekday,
} from "./DateInput.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CalendarIcon = icons[${JSON.stringify(calendarIcon)}];
const PreviousIcon = icons[${JSON.stringify(previousIcon)}];
const NextIcon = icons[${JSON.stringify(nextIcon)}];
const ClearIcon = icons[${JSON.stringify(clearIcon)}];

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface DateInputProps extends CommonComponentProps, FieldableInputProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (date: Date | null) => void;
  min?: Date;
  max?: Date;
  isDateUnavailable?: (date: Date) => boolean;
  granularity?: "day" | "month" | "year";
  locale?: string;
  readOnly?: boolean;
  clearable?: boolean;
  render?: RenderProp<"input">;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthMatrix(viewDate: Date): Date[][] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 6 }, (_, week) =>
    Array.from(
      { length: 7 },
      (_, day) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + week * 7 + day),
    ),
  );
}

export function DateInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  isDateUnavailable,
  granularity: _granularity = "day",
  locale,
  readOnly = false,
  clearable = false,
  name,
  disabled = false,
  required = false,
  invalid = false,
  onFocus,
  onBlur,
  className,
  render,
  ...props
}: DateInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<Date | null>(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : uncontrolledValue;
  const [viewDate, setViewDate] = useState(selected ?? new Date());
  const [open, setOpen] = useState(false);

  const formatter = new Intl.DateTimeFormat(locale);
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });

  function commitValue(next: Date | null) {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  }

  function isUnavailable(date: Date): boolean {
    if (min && date < min) return true;
    if (max && date > max) return true;
    return isDateUnavailable?.(date) ?? false;
  }

  const classes = [dateInputRoot, className].filter(Boolean).join(" ");
  const today = new Date();

  return (
    <BasePopover.Root open={open} onOpenChange={setOpen}>
      <div
        className={classes}
        data-slot="date-input"
        data-invalid={invalid || undefined}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
      >
        {renderElement(
          "input",
          render,
          {
            ...props,
            type: "text",
            readOnly: true,
            value: selected ? formatter.format(selected) : "",
            name,
            disabled,
            required,
            onFocus,
            onBlur,
            className: dateInputField,
          } as never,
        )}
        {clearable && selected && (
          <button
            type="button"
            className={dateInputIconButton}
            aria-label="Clear"
            onClick={() => commitValue(null)}
          >
            <ClearIcon className={dateInputIcon} aria-hidden="true" />
          </button>
        )}
        <BasePopover.Trigger
          className={dateInputIconButton}
          aria-label="Open calendar"
          disabled={disabled || readOnly}
        >
          <CalendarIcon className={dateInputIcon} aria-hidden="true" />
        </BasePopover.Trigger>
      </div>
      <BasePopover.Portal>
        <BasePopover.Positioner className={dateInputPositioner} side="bottom" align="start">
          <BasePopover.Popup className={dateInputPopup} data-slot="date-input-popup">
            <div className={dateInputHeader}>
              <button
                type="button"
                className={dateInputNavButton}
                aria-label="Previous month"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              >
                <PreviousIcon className={dateInputIcon} aria-hidden="true" style={{ transform: "rotate(90deg)" }} />
              </button>
              <span className={dateInputMonthLabel}>{monthFormatter.format(viewDate)}</span>
              <button
                type="button"
                className={dateInputNavButton}
                aria-label="Next month"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                <NextIcon className={dateInputIcon} aria-hidden="true" style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>
            <div className={dateInputGrid}>
              {WEEKDAY_LABELS.map((label) => (
                <span key={label} className={dateInputWeekday}>
                  {label}
                </span>
              ))}
              {getMonthMatrix(viewDate).flat().map((date) => {
                const unavailable = isUnavailable(date);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    className={dateInputDay}
                    disabled={unavailable}
                    data-outside-month={date.getMonth() !== viewDate.getMonth() || undefined}
                    data-today={isSameDay(date, today) || undefined}
                    data-selected={(selected && isSameDay(date, selected)) || undefined}
                    onClick={() => {
                      commitValue(date);
                      setOpen(false);
                    }}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
`,
  };
}
