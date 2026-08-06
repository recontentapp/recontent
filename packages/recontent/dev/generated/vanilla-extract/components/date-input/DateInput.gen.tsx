import { useState } from "react";
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

const CalendarIcon = icons["info"];
const PreviousIcon = icons["chevronDown"];
const NextIcon = icons["chevronDown"];
const ClearIcon = icons["close"];

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
