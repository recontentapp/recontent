import { useState, type KeyboardEvent, type MouseEvent } from "react";
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

const CalendarIcon = icons["info"];
const PreviousIcon = icons["chevronDown"];
const NextIcon = icons["chevronDown"];
const ClearIcon = icons["close"];

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
                // our own header above, driven by the same `viewDate` state.
                Nav: () => <></>,
                MonthCaption: () => <></>,
                // react-day-picker hardcodes `<thead>` without forwarding
                // classNames.weekdays to it, so it keeps its default
                // `table-header-group` display and breaks out of the grid
                // laid out on `dateInputGrid`. Wrap it ourselves instead.
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
