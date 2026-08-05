import type { InternalModuleDefinition } from "./types.js";
import type { RegistryComponentDefinition } from "./define.js";
import { boxComponent } from "./components/box/index.js";
import { stackComponent } from "./components/stack/index.js";
import { stackItemComponent } from "./components/stack-item/index.js";
import { gridComponent } from "./components/grid/index.js";
import { textComponent } from "./components/text/index.js";
import { iconComponent } from "./components/icon/index.js";
import { buttonComponent } from "./components/button/index.js";
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
