import type { ComponentSourceFiles, TokenImport } from "../../types.js";
import { focusRingBlock } from "../shared.js";

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
  focusRingColor: TokenImport | undefined;
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
    ${focusRingBlock(focusRingColor, { selector: "&:has(:focus-visible)" })}
  },
});

export const dateInputField = style({
  flex: 1,
  minWidth: 0,
  boxSizing: "border-box",
  border: "none",
  outline: "none",
  background: "none",
  cursor: "pointer",
  color: ${color.reference},
  paddingTop: ${verticalSpacing.reference},
  paddingBottom: ${verticalSpacing.reference},
  ${typographyProps(typography.reference)},
  "::placeholder": {
    color: ${placeholderColor.reference},
  },
  ":disabled": {
    cursor: "not-allowed",
  },
  selectors: {
    [\`\${dateInputRoot}[data-readonly] &\`]: {
      cursor: "default",
    },
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
  outline: "none",
  border: "none",
  background: "none",
  padding: 0,
  color: ${iconColor.reference},
  ${focusRingBlock(focusRingColor)}
  selectors: {
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
});

export const dateInputMonths = style({
  display: "flex",
  flexDirection: "column",
});

export const dateInputMonthLabel = style({
  ${typographyProps(dayTypography.reference)},
  color: ${dayColor.reference},
  textAlign: "center",
});

export const dateInputGrid = style({
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "0.125rem",
  borderCollapse: "collapse",
});

/**
 * react-day-picker renders \`month_grid\` as a \`<table>\`, with a \`<thead>\`
 * wrapping the weekday \`<tr>\` and a \`<tbody>\` wrapping the week \`<tr>\`s.
 * All of \`thead\`, \`tbody\` and \`tr\` must become transparent to CSS Grid via
 * \`display: contents\` for the \`<td>\`/\`<th>\` cells to flow as direct grid
 * items of \`dateInputGrid\`; otherwise the browser generates an anonymous
 * table around \`thead\`/\`tbody\` (since they keep their table-group display)
 * and lays out each row as its own independent table, ignoring the grid.
 */
export const dateInputRow = style({
  display: "contents",
});

export const dateInputRowGroup = style({
  display: "contents",
});

export const dateInputWeekday = style({
  textAlign: "center",
  color: ${weekdayColor.reference},
  ${typographyProps(weekdayTypography.reference)},
});

/** Marker classes applied by react-day-picker's \`classNames\` to the day cell; styled on the button via a descendant selector below. */
export const dateInputDaySelected = style({});
export const dateInputDayToday = style({});
export const dateInputDayOutside = style({});
export const dateInputDayDisabled = style({});

export const dateInputDay = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  width: "100%",
  aspectRatio: "1",
  cursor: "pointer",
  outline: "none",
  border: "1px solid transparent",
  borderRadius: ${dayBorderRadius.reference},
  color: ${dayColor.reference},
  backgroundColor: "transparent",
  ${typographyProps(dayTypography.reference)},
  ":hover": {
    backgroundColor: ${dayHoverBackgroundColor.reference},
  },
  selectors: {
    [\`.\${dateInputDayOutside} &\`]: {
      color: ${dayOutsideMonthColor.reference},
    },
    [\`.\${dateInputDayToday} &\`]: {
      borderColor: ${dayTodayBorderColor.reference},
    },
    [\`.\${dateInputDaySelected} &\`]: {
      backgroundColor: ${daySelectedBackgroundColor.reference},
      color: ${daySelectedColor.reference},
    },
    [\`.\${dateInputDayDisabled} &\`]: {
      color: ${dayDisabledColor.reference},
      cursor: "not-allowed",
    },
  },
});

`,
    component: `import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { enUS } from "react-day-picker/locale";
import { format } from "date-fns";
import {
  dateInputDay,
  dateInputDayDisabled,
  dateInputDayOutside,
  dateInputDaySelected,
  dateInputDayToday,
  dateInputField,
  dateInputGrid,
  dateInputHeader,
  dateInputIcon,
  dateInputIconButton,
  dateInputMonthLabel,
  dateInputMonths,
  dateInputNavButton,
  dateInputPopup,
  dateInputPositioner,
  dateInputRoot,
  dateInputRow,
  dateInputRowGroup,
  dateInputWeekday,
} from "./DateInput.gen.css";
import { renderElement, type CommonComponentProps, type FieldableInputProps, type RenderProp } from "../../renderElement.gen";
import { icons } from "../../iconMap";

const CalendarIcon = icons[${JSON.stringify(calendarIcon)}];
const PreviousIcon = icons[${JSON.stringify(previousIcon)}];
const NextIcon = icons[${JSON.stringify(nextIcon)}];
const ClearIcon = icons[${JSON.stringify(clearIcon)}];

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

  function openFromField() {
    if (disabled || readOnly) return;
    setOpen(true);
  }

  return (
    <BasePopover.Root open={open} onOpenChange={setOpen} modal="trap-focus">
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
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            onFocus,
            onBlur,
            // Prevents the browser's default click-to-focus behavior so the
            // field never becomes focus-visible from a mouse interaction
            // (only the ring-worthy Tab/keyboard path should focus it); the
            // click still opens the popup via the handler below.
            onMouseDown: (event: MouseEvent<HTMLInputElement>) => {
              if (disabled || readOnly) return;
              event.preventDefault();
            },
            onClick: openFromField,
            onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                event.preventDefault();
                openFromField();
              }
            },
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
              <span className={dateInputMonthLabel}>{format(viewDate, "LLLL yyyy")}</span>
              <button
                type="button"
                className={dateInputNavButton}
                aria-label="Next month"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                <NextIcon className={dateInputIcon} aria-hidden="true" style={{ transform: "rotate(-90deg)" }} />
              </button>
            </div>
            <DayPicker
              mode="single"
              locale={enUS}
              month={viewDate}
              onMonthChange={setViewDate}
              selected={selected ?? undefined}
              onSelect={(date) => {
                commitValue(date ?? null);
                setOpen(false);
              }}
              disabled={isUnavailable}
              showOutsideDays
              className={dateInputMonths}
              classNames={{
                month_grid: dateInputGrid,
                weekdays: dateInputRow,
                weekday: dateInputWeekday,
                weeks: dateInputRowGroup,
                week: dateInputRow,
                day_button: dateInputDay,
                selected: dateInputDaySelected,
                today: dateInputDayToday,
                outside: dateInputDayOutside,
                disabled: dateInputDayDisabled,
              }}
              components={{
                // The month caption and prev/next navigation are rendered by
                // our own header above, driven by the same \`viewDate\` state.
                Nav: () => <></>,
                MonthCaption: () => <></>,
                // react-day-picker hardcodes \`<thead>\` without forwarding
                // classNames.weekdays to it, so it keeps its default
                // \`table-header-group\` display and breaks out of the grid
                // laid out on \`dateInputGrid\`. Wrap it ourselves instead.
                Weekdays: (weekdaysProps) => (
                  <thead aria-hidden="true" className={dateInputRowGroup}>
                    <tr {...weekdaysProps} />
                  </thead>
                ),
              }}
            />
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}
`,
  };
}
