import type { ComponentInfo, PropInfo, TypeInfo } from "../../src/introspection/model.js";
import type { DocToken } from "../../src/snapshot/doc-token.js";

/** Builders for the inspect model, shared by the select and render specs. */

export function token(
  path: string,
  type: DocToken["type"],
  extra: Partial<DocToken> = {},
): DocToken {
  return {
    layer: path.split(".")[0] as DocToken["layer"],
    path,
    name: path.split(".").at(-1)!,
    type,
    cssVar: `--${path.replaceAll(".", "-")}`,
    values: { default: "x" },
    ...extra,
  };
}

export const prop = (name: string, extra: Partial<PropInfo> = {}): PropInfo => ({
  name,
  type: "string",
  required: false,
  ...extra,
});

export const component = (name: string, extra: Partial<ComponentInfo> = {}): ComponentInfo => ({
  name,
  sourceFilePath: "src/x.tsx",
  line: 1,
  props: [],
  inherits: [],
  references: [],
  ...extra,
});

export const typeInfo = (
  id: string,
  references: string[] = [],
  extra: Partial<TypeInfo> = {},
): TypeInfo => ({
  id,
  name: id.replace(/ \(.*/, ""),
  kind: "interface",
  sourceFilePath: "src/x.ts",
  line: 1,
  definition: `interface ${id} {}`,
  references,
  ...extra,
});
