import type { FileHistory } from "../git/types.js";

export const INTROSPECTION_SCHEMA_VERSION = "1";

export type IntrospectionConfigInput = {
  /** Barrel file, relative to the config. Every export that resolves to a React component is introspected. */
  entry: string;
  /** Defaults to the nearest tsconfig.json upward from `entry`. */
  tsconfig?: string;
  /** Export names to skip. */
  exclude?: string[];
};

export type PropInfo = {
  name: string;
  /** Declared type text when there is a type node, else the checker's rendering. */
  type: string;
  /** Set when the non-nullable type is a union of literals. */
  values?: (string | number | boolean)[];
  required: boolean;
  /** `@default` tag, else the destructuring default in the implementation. */
  defaultValue?: string;
  description?: string;
  deprecated?: true | string;
};

export type InheritedProps = {
  /** The most derived type the props come from, e.g. `ButtonHTMLAttributes`. */
  name: string;
  package?: string;
  count: number;
};

export type ComponentInfo = {
  /** Export name, dotted for subcomponents (`Tabs.Item`). */
  name: string;
  /** Posix path relative to the config root. */
  sourceFilePath: string;
  /** 1-based line of the declaration. */
  line: number;
  history?: FileHistory;
  description?: string;
  deprecated?: true | string;
  /** Props declared outside node_modules, sorted by name. */
  props: PropInfo[];
  inherits: InheritedProps[];
};

export type ComponentManifest = {
  schemaVersion: typeof INTROSPECTION_SCHEMA_VERSION;
  /** Sorted by name. */
  components: ComponentInfo[];
  warnings: { message: string; component?: string }[];
};
