export type IntrospectionConfigInput = {
  /** Barrel file, relative to the config. Every export that resolves to a React component is introspected. */
  entry: string;
  /** Defaults to the nearest tsconfig.json upward from `entry`. */
  tsconfig?: string;
  /** Export names to skip. */
  exclude?: string[];
  /** Read each component file's last commit date into `lastUpdatedAt`. Defaults to `false`. */
  history?: boolean;
};

export type PropInfo = {
  name: string;
  /** Declared type text when there is a type node, else the checker's rendering. */
  type: string;
  /** `type` with a project-local alias expanded, e.g. `Width` → `number | "auto"`. Only set when it differs. */
  resolved?: string;
  /** Set when the non-nullable type is a union of literals. */
  values?: (string | number | boolean)[];
  /** Ids of the project types `type` mentions, sorted. Each is in the introspection's `types`. */
  references?: string[];
  required: boolean;
  /** `@default` tag, else the destructuring default in the implementation, as written in source (`"\"solid\""`), not evaluated: unlike `values`, which holds JSON values. */
  defaultValue?: string;
  description?: string;
  deprecated?: true | string;
};

export type InheritedProps = {
  /** The most derived type the props come from, e.g. `ButtonHTMLAttributes`. */
  name: string;
  package?: string;
  /** Sorted prop names. */
  props: string[];
};

export type TypeParameterInfo = {
  name: string;
  constraint?: string;
  default?: string;
};

export type ComponentInfo = {
  /** Export name, dotted for subcomponents (`Tabs.Item`). */
  name: string;
  typeParameters?: TypeParameterInfo[];
  /** Posix path relative to the config root. */
  sourceFilePath: string;
  /** 1-based line of the declaration. */
  line: number;
  /** ISO 8601 date of the last commit touching `sourceFilePath`. Only with `introspection.history`. */
  lastUpdatedAt?: string;
  description?: string;
  deprecated?: true | string;
  /** Props declared outside node_modules, sorted by name. */
  props: PropInfo[];
  inherits: InheritedProps[];
  /** Ids of the project types its props mention directly, sorted. A type's own references lead to the rest. */
  references: string[];
};

/** A named type declared in the project that components' props depend on, transitively. External types stay as written. */
export type TypeInfo = {
  /** The declared name; `name (src/path.ts)` only when two project types share a name. Unique. */
  id: string;
  name: string;
  kind: "interface" | "type" | "enum";
  typeParameters?: TypeParameterInfo[];
  /** Posix path relative to the config root. */
  sourceFilePath: string;
  /** 1-based line of the declaration. */
  line: number;
  description?: string;
  deprecated?: true | string;
  /** The declaration as written, comments removed, without `export`. */
  definition: string;
  /** Interfaces and object-literal aliases: members sorted by name, described like component props. */
  members?: PropInfo[];
  inherits?: InheritedProps[];
  /** Enums and literal-union aliases. */
  values?: (string | number | boolean)[];
  /** Ids of the project types this one mentions directly, sorted. */
  references: string[];
};
