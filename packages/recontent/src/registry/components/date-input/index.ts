import type { TokenBinding } from "@recontentapp/core";
import { defineRegistryComponent } from "../../define.js";
import { vanillaExtractComponentOutput } from "../shared.js";
import { generateDateInputSources } from "./vanilla-extract.js";

export type DateInputComponentOptions = {
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
  focusRingColor: TokenBinding<"color">;
  invalidBorderColor: TokenBinding<"color">;
  disabledBackgroundColor: TokenBinding<"color">;
  disabledColor: TokenBinding<"color">;
  readOnlyBackgroundColor: TokenBinding<"color">;
  iconColor: TokenBinding<"color">;
  iconSize: TokenBinding<"dimension">;
  affixColor: TokenBinding<"color">;
  affixBackgroundColor: TokenBinding<"color">;
  // DateInput-specific.
  popupBackgroundColor: TokenBinding<"color">;
  popupBorder: TokenBinding<"border">;
  popupBorderRadius: TokenBinding<"dimension">;
  popupShadow: TokenBinding<"shadow">;
  popupSpacing: TokenBinding<"dimension">;
  popupOffset: TokenBinding<"dimension">;
  dayTypography: TokenBinding<"typography">;
  dayColor: TokenBinding<"color">;
  dayBorderRadius: TokenBinding<"dimension">;
  dayHoverBackgroundColor: TokenBinding<"color">;
  daySelectedBackgroundColor: TokenBinding<"color">;
  daySelectedColor: TokenBinding<"color">;
  dayTodayBorderColor: TokenBinding<"color">;
  dayOutsideMonthColor: TokenBinding<"color">;
  dayDisabledColor: TokenBinding<"color">;
  weekdayTypography: TokenBinding<"typography">;
  weekdayColor: TokenBinding<"color">;
};

/**
 * Icons aren't token bindings (Icon isn't a `ComponentContract` kind), so —
 * like TextInput's clear icon — these are build-time choices baked directly
 * into the generated component rather than `recontent.config.ts` bindings.
 */
const CALENDAR_ICON = "info";
const PREVIOUS_ICON = "chevronDown";
const NEXT_ICON = "chevronDown";
const CLEAR_ICON = "close";

export const dateInputComponent = defineRegistryComponent<DateInputComponentOptions>()({
  id: "date-input",
  name: "DateInput",
  internalDependencies: ["render-element", "icon-map"],
  schema: {
    borderRadius: { kind: "token", type: "dimension", description: "Corner radius of the input." },
    border: { kind: "token", type: "border", description: "Border applied around the input." },
    backgroundColor: { kind: "token", type: "color", description: "Background color of the input." },
    color: { kind: "token", type: "color", description: "Text color of the input." },
    typography: { kind: "token", type: "typography", description: "Typography applied to the input." },
    placeholderColor: { kind: "token", type: "color", description: "Text color of the placeholder." },
    horizontalSpacing: { kind: "token", type: "dimension", description: "Left/right padding of the input." },
    verticalSpacing: { kind: "token", type: "dimension", description: "Top/bottom padding of the input." },
    gap: { kind: "token", type: "dimension", description: "Space between affixes, icons and the field." },
    hoverBorderColor: { kind: "token", type: "color", description: "Border color of the input on hover." },
    focusBorderColor: { kind: "token", type: "color", description: "Border color of the input on focus." },
    focusRingColor: { kind: "token", type: "color", description: "Outline color shown on keyboard focus." },
    invalidBorderColor: { kind: "token", type: "color", description: "Border color of the input when invalid." },
    disabledBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when disabled.",
    },
    disabledColor: { kind: "token", type: "color", description: "Text color of the input when disabled." },
    readOnlyBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the input when read-only.",
    },
    iconColor: { kind: "token", type: "color", description: "Color of the calendar/clear icons." },
    iconSize: { kind: "token", type: "dimension", description: "Size of the calendar/clear icons." },
    affixColor: { kind: "token", type: "color", description: "Text color of the prefix/suffix." },
    affixBackgroundColor: { kind: "token", type: "color", description: "Background color of the prefix/suffix." },
    popupBackgroundColor: { kind: "token", type: "color", description: "Background color of the calendar popup." },
    popupBorder: { kind: "token", type: "border", description: "Border applied around the popup." },
    popupBorderRadius: { kind: "token", type: "dimension", description: "Corner radius of the popup." },
    popupShadow: { kind: "token", type: "shadow", description: "Shadow applied to the popup." },
    popupSpacing: { kind: "token", type: "dimension", description: "Padding around the calendar." },
    popupOffset: { kind: "token", type: "dimension", description: "Gap between the input and the popup." },
    dayTypography: { kind: "token", type: "typography", description: "Typography of a day cell." },
    dayColor: { kind: "token", type: "color", description: "Text color of a day cell." },
    dayBorderRadius: { kind: "token", type: "dimension", description: "Corner radius of a day cell." },
    dayHoverBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of a day cell on hover.",
    },
    daySelectedBackgroundColor: {
      kind: "token",
      type: "color",
      description: "Background color of the selected day.",
    },
    daySelectedColor: { kind: "token", type: "color", description: "Text color of the selected day." },
    dayTodayBorderColor: { kind: "token", type: "color", description: "Border color marking today's day." },
    dayOutsideMonthColor: {
      kind: "token",
      type: "color",
      description: "Text color of a day outside the visible month.",
    },
    dayDisabledColor: { kind: "token", type: "color", description: "Text color of an unavailable day." },
    weekdayTypography: { kind: "token", type: "typography", description: "Typography of a weekday header." },
    weekdayColor: { kind: "token", type: "color", description: "Text color of a weekday header." },
  },
  outputs: {
    "vanilla-extract": vanillaExtractComponentOutput(
      "date-input",
      "DateInput",
      (_scales, _breakpoints, tokens) =>
        generateDateInputSources({
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
          focusRingColor: tokens.focusRingColor!,
          invalidBorderColor: tokens.invalidBorderColor!,
          disabledBackgroundColor: tokens.disabledBackgroundColor!,
          disabledColor: tokens.disabledColor!,
          readOnlyBackgroundColor: tokens.readOnlyBackgroundColor!,
          iconColor: tokens.iconColor!,
          iconSize: tokens.iconSize!,
          affixColor: tokens.affixColor!,
          affixBackgroundColor: tokens.affixBackgroundColor!,
          popupBackgroundColor: tokens.popupBackgroundColor!,
          popupBorder: tokens.popupBorder!,
          popupBorderRadius: tokens.popupBorderRadius!,
          popupShadow: tokens.popupShadow!,
          popupSpacing: tokens.popupSpacing!,
          popupOffset: tokens.popupOffset!,
          dayTypography: tokens.dayTypography!,
          dayColor: tokens.dayColor!,
          dayBorderRadius: tokens.dayBorderRadius!,
          dayHoverBackgroundColor: tokens.dayHoverBackgroundColor!,
          daySelectedBackgroundColor: tokens.daySelectedBackgroundColor!,
          daySelectedColor: tokens.daySelectedColor!,
          dayTodayBorderColor: tokens.dayTodayBorderColor!,
          dayOutsideMonthColor: tokens.dayOutsideMonthColor!,
          dayDisabledColor: tokens.dayDisabledColor!,
          weekdayTypography: tokens.weekdayTypography!,
          weekdayColor: tokens.weekdayColor!,
          calendarIcon: CALENDAR_ICON,
          previousIcon: PREVIOUS_ICON,
          nextIcon: NEXT_ICON,
          clearIcon: CLEAR_ICON,
        }),
      { "@base-ui/react": "^1.0.0" },
    ),
  },
});
