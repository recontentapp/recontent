import type { ComponentOutput, RegistryComponentDefinition, RegistryManifest } from "./types.js";
import { builtInComponentContracts } from "./built-in-components.js";

const runtimeDependencies = {
  "@vanilla-extract/css": "^1.17.4",
  react: ">=18",
};

function output(id: string, name: string): ComponentOutput {
  return {
    artifacts: [
      {
        path: `components/${id}/${name}.gen.css.ts`,
      },
      {
        path: `components/${id}/${name}.gen.tsx`,
      },
    ],
    runtimeDependencies,
  };
}

function component(
  id: keyof typeof builtInComponentContracts,
  name: string,
): RegistryComponentDefinition {
  return {
    id,
    name,
    contracts: builtInComponentContracts[id],
    dependencies: [],
    outputs: {
      "vanilla-extract": output(id, name),
    },
  };
}

const components: readonly RegistryComponentDefinition[] = [component("stack", "Stack")];

export const registryComponents = Object.fromEntries(
  components.map((entry) => [entry.id, entry]),
) as Record<string, RegistryComponentDefinition>;

export const registryManifest: RegistryManifest = {
  version: 1,
  components: registryComponents,
};

export type RegistryComponentId = keyof typeof registryComponents;
export type RegistryComponentName = (typeof components)[number]["name"];
