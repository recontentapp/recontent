export type ObservabilityConfigInput = {
  tsConfigPath: string;
  globPattern: string | string[];
  ignoreGlobPattern?: string[];
  componentsConfigPath: string;
  codeownersPath?: string;
  programBatchSize?: number;
  profile?: boolean;
};
export type NormalizedObservabilityConfig = {
  tsConfigPath: string;
  globPattern: string[];
  ignoreGlobPattern: string[];
  componentsConfigPath: string;
  codeownersPath?: string;
  programBatchSize: number;
  profile: boolean;
};

export type PropValueKind =
  | "literal-string"
  | "literal-number"
  | "literal-boolean"
  | "null"
  | "jsx"
  | "array"
  | "object"
  | "identifier"
  | "call"
  | "member"
  | "conditional"
  | "template";
export type PropValue = {
  name: string;
  valueKind: PropValueKind;
  value?: string | number | boolean | null;
  raw: string;
  resolved: boolean;
};
export type SoundnessBucket = "resolved" | "unresolved";
export type InstanceEvent = {
  schemaVersion: string;
  runId: string;
  commit?: string;
  branch?: string;
  componentId: string;
  resolvedFrom: "local" | "package";
  packageName?: string;
  packageVersion?: string;
  exportName: string;
  localName: string;
  file: string;
  line: number;
  column: number;
  enclosingComponent?: string;
  enclosingFileKind?: "page" | "route" | "component";
  squad?: string;
  props: PropValue[];
  booleanShorthand: string[];
  hasSpread: boolean;
  propsComplete: boolean;
  propNames: string[];
  propSignatureHash: string;
  hasChildren: boolean;
  childrenKind?: "text" | "elements" | "expression" | "none";
  trackedChildComponentIds: string[];
  bucket: SoundnessBucket;
  confidence: number;
};
export type EdgeEvent = {
  schemaVersion: string;
  runId: string;
  commit?: string;
  branch?: string;
  type: "import" | "couse";
  from?: string;
  to?: string;
  kind?: string;
  a?: string;
  b?: string;
  weight?: number;
  scope?: "file" | "route" | "transitive";
};
export type RunMetadata = { runId: string; commit?: string; branch?: string };
