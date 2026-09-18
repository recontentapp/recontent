import type { InternalModuleDefinition } from "./types.js";
import type { RegistryComponentDefinition } from "./define.js";
import { boxComponent } from "./components/box/index.js";
import { stackComponent } from "./components/stack/index.js";
import { stackItemComponent } from "./components/stack-item/index.js";
import { gridComponent } from "./components/grid/index.js";
import { textComponent } from "./components/text/index.js";
import { iconComponent } from "./components/icon/index.js";
import { buttonComponent } from "./components/button/index.js";
import { avatarComponent } from "./components/avatar/index.js";
import { quoteBlockComponent } from "./components/quote-block/index.js";
import { codeComponent } from "./components/code/index.js";
import { keyboardShortcutComponent } from "./components/keyboard-shortcut/index.js";
import { dividerComponent } from "./components/divider/index.js";
import { collapsibleComponent } from "./components/collapsible/index.js";
import { accordionComponent } from "./components/accordion/index.js";
import { linkComponent } from "./components/link/index.js";
import { iconButtonComponent } from "./components/icon-button/index.js";
import { dropdownButtonComponent } from "./components/dropdown-button/index.js";
import { segmentedControlsComponent } from "./components/segmented-controls/index.js";
import { selectableCardComponent } from "./components/selectable-card/index.js";
import { actionBarComponent } from "./components/action-bar/index.js";
import { badgeComponent } from "./components/badge/index.js";
import { bannerComponent } from "./components/banner/index.js";
import { skeletonComponent } from "./components/skeleton/index.js";
import { spinnerComponent } from "./components/spinner/index.js";
import { progressBarComponent } from "./components/progress-bar/index.js";
import { checkboxComponent } from "./components/checkbox/index.js";
import { radioListComponent } from "./components/radio-list/index.js";
import { switchComponent } from "./components/switch/index.js";
import { toggleComponent } from "./components/toggle/index.js";
import { selectComponent } from "./components/select/index.js";
import { autocompleteComponent } from "./components/autocomplete/index.js";
import { fileInputComponent } from "./components/file-input/index.js";
import { sliderComponent } from "./components/slider/index.js";
import { textInputComponent } from "./components/text-input/index.js";
import { numberInputComponent } from "./components/number-input/index.js";
import { dateInputComponent } from "./components/date-input/index.js";
import { textareaComponent } from "./components/textarea/index.js";
import { fieldComponent } from "./components/field/index.js";
import { breadcrumbComponent } from "./components/breadcrumb/index.js";
import { outlineComponent } from "./components/outline/index.js";
import { paginationComponent } from "./components/pagination/index.js";
import { tabsComponent } from "./components/tabs/index.js";
import { stepsComponent } from "./components/steps/index.js";
import { dialogComponent } from "./components/dialog/index.js";
import { drawerComponent } from "./components/drawer/index.js";
import { tooltipComponent } from "./components/tooltip/index.js";
import { popoverComponent } from "./components/popover/index.js";
import { toastComponent } from "./components/toast/index.js";
import { metadataListComponent } from "./components/metadata-list/index.js";
import { treeListComponent } from "./components/tree-list/index.js";
import { timelineComponent } from "./components/timeline/index.js";
import { renderElementModule } from "./internal/render-element/index.js";
import { iconMapModule } from "./internal/icon-map/index.js";
import { responsiveModule } from "./internal/responsive/index.js";
import { useBreakpointModule } from "./internal/use-breakpoint/index.js";

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
