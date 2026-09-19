import type { InternalModuleDefinition } from "./types.js";
import type { RegistryComponentDefinition } from "./define.js";
import { boxComponent } from "./components/box.js";
import { stackComponent } from "./components/stack.js";
import { stackItemComponent } from "./components/stack-item.js";
import { gridComponent } from "./components/grid.js";
import { textComponent } from "./components/text.js";
import { iconComponent } from "./components/icon.js";
import { buttonComponent } from "./components/button.js";
import { avatarComponent } from "./components/avatar.js";
import { quoteBlockComponent } from "./components/quote-block.js";
import { codeComponent } from "./components/code.js";
import { keyboardShortcutComponent } from "./components/keyboard-shortcut.js";
import { dividerComponent } from "./components/divider.js";
import { collapsibleComponent } from "./components/collapsible.js";
import { accordionComponent } from "./components/accordion.js";
import { linkComponent } from "./components/link.js";
import { iconButtonComponent } from "./components/icon-button.js";
import { dropdownButtonComponent } from "./components/dropdown-button.js";
import { segmentedControlsComponent } from "./components/segmented-controls.js";
import { selectableCardComponent } from "./components/selectable-card.js";
import { actionBarComponent } from "./components/action-bar.js";
import { badgeComponent } from "./components/badge.js";
import { bannerComponent } from "./components/banner.js";
import { skeletonComponent } from "./components/skeleton.js";
import { spinnerComponent } from "./components/spinner.js";
import { progressBarComponent } from "./components/progress-bar.js";
import { checkboxComponent } from "./components/checkbox.js";
import { radioListComponent } from "./components/radio-list.js";
import { switchComponent } from "./components/switch.js";
import { toggleComponent } from "./components/toggle.js";
import { selectComponent } from "./components/select.js";
import { autocompleteComponent } from "./components/autocomplete.js";
import { fileInputComponent } from "./components/file-input.js";
import { sliderComponent } from "./components/slider.js";
import { textInputComponent } from "./components/text-input.js";
import { numberInputComponent } from "./components/number-input.js";
import { dateInputComponent } from "./components/date-input.js";
import { textareaComponent } from "./components/textarea.js";
import { fieldComponent } from "./components/field.js";
import { breadcrumbComponent } from "./components/breadcrumb.js";
import { outlineComponent } from "./components/outline.js";
import { paginationComponent } from "./components/pagination.js";
import { tabsComponent } from "./components/tabs.js";
import { stepsComponent } from "./components/steps.js";
import { dialogComponent } from "./components/dialog.js";
import { drawerComponent } from "./components/drawer.js";
import { tooltipComponent } from "./components/tooltip.js";
import { popoverComponent } from "./components/popover.js";
import { toastComponent } from "./components/toast.js";
import { metadataListComponent } from "./components/metadata-list.js";
import { treeListComponent } from "./components/tree-list.js";
import { timelineComponent } from "./components/timeline.js";
import { renderElementModule } from "./internal/render-element.js";
import { iconMapModule } from "./internal/icon-map.js";
import { responsiveModule } from "./internal/responsive.js";
import { useBreakpointModule } from "./internal/use-breakpoint.js";

const definitions = [
  boxComponent,
  stackComponent,
  stackItemComponent,
  gridComponent,
  textComponent,
  iconComponent,
  buttonComponent,
  avatarComponent,
  quoteBlockComponent,
  codeComponent,
  keyboardShortcutComponent,
  dividerComponent,
  collapsibleComponent,
  accordionComponent,
  linkComponent,
  iconButtonComponent,
  dropdownButtonComponent,
  segmentedControlsComponent,
  selectableCardComponent,
  actionBarComponent,
  badgeComponent,
  bannerComponent,
  skeletonComponent,
  spinnerComponent,
  progressBarComponent,
  checkboxComponent,
  radioListComponent,
  switchComponent,
  toggleComponent,
  selectComponent,
  autocompleteComponent,
  fileInputComponent,
  sliderComponent,
  textInputComponent,
  numberInputComponent,
  dateInputComponent,
  textareaComponent,
  fieldComponent,
  breadcrumbComponent,
  outlineComponent,
  paginationComponent,
  tabsComponent,
  stepsComponent,
  dialogComponent,
  drawerComponent,
  tooltipComponent,
  popoverComponent,
  toastComponent,
  metadataListComponent,
  treeListComponent,
  timelineComponent,
] as const;

export const registryComponents = Object.fromEntries(definitions.map((d) => [d.id, d])) as Record<
  string,
  RegistryComponentDefinition
>;

export const componentsByName = Object.fromEntries(definitions.map((d) => [d.name, d])) as Record<
  string,
  RegistryComponentDefinition
>;

const internalModuleDefinitions = [
  renderElementModule,
  iconMapModule,
  responsiveModule,
  useBreakpointModule,
] as const;

export const internalModules = Object.fromEntries(
  internalModuleDefinitions.map((d) => [d.id, d]),
) as Record<string, InternalModuleDefinition>;

export type RegistryComponentName = (typeof definitions)[number]["name"];

export type BuiltInComponentOptions = {
  [D in (typeof definitions)[number] as D["name"]]?: NonNullable<D["__options"]>;
};
