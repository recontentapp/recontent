import type { RegistryManifest } from "./types.js";
import type { RegistryComponentDefinition } from "./define.js";
import { sharedComponent } from "./components/shared/index.js";
import { boxComponent } from "./components/box/index.js";
import { stackComponent } from "./components/stack/index.js";
import { stackItemComponent } from "./components/stack-item/index.js";

const definitions = [sharedComponent, boxComponent, stackComponent, stackItemComponent] as const;

export const registryComponents = Object.fromEntries(definitions.map((d) => [d.id, d])) as Record<
  string,
  RegistryComponentDefinition
>;

export const registryManifest: RegistryManifest = {
  version: 1,
  components: registryComponents,
};

export type RegistryComponentId = (typeof definitions)[number]["id"];
export type RegistryComponentName = (typeof definitions)[number]["name"];

export type BuiltInComponentOptions = {
  [D in (typeof definitions)[number] as D["name"]]?: NonNullable<D["__options"]>;
};
