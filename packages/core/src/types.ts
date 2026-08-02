import type { ColorSpace, Component } from "./color.js";

export type ColorValue = {
  colorSpace: ColorSpace;
  components: [Component, Component, Component];
  alpha: number;
  hex: string;
};

export type DimensionValue = { value: number; unit: "px" | "rem" };
export type FontFamilyValue = { value: string[] };
export type FontWeightName =
  | "thin"
  | "hairline"
  | "extralight"
  | "extra-light"
  | "ultra-light"
  | "light"
  | "regular"
  | "normal"
  | "medium"
  | "book"
  | "semibold"
  | "semi-bold"
  | "demi-bold"
  | "bold"
  | "extrabold"
  | "extra-bold"
  | "ultra-bold"
  | "black"
  | "heavy"
  | "extrablack"
  | "extra-black"
  | "ultra-black";
export type FontWeightValue = { value: number | FontWeightName };
export type DurationValue = { value: number; unit: "ms" | "s" };
export type CubicBezierValue = { value: [number, number, number, number] };
export type NumberValue = { value: number };

export type TokenMember<T extends TokenType = TokenType> = {
  $value: TokenTypeMap[T];
  alias?: string[];
};

export type StrokeStyleName =
  | "solid"
  | "dashed"
  | "dotted"
  | "double"
  | "groove"
  | "ridge"
  | "outset"
  | "inset";
export type StrokeStyleValue =
  | { style: StrokeStyleName }
  | { dashArray: DimensionValue[]; lineCap: "round" | "butt" | "square" };

export type ShadowLayer = {
  color: TokenMember<"color">;
  offsetX: TokenMember<"dimension">;
  offsetY: TokenMember<"dimension">;
  blur: TokenMember<"dimension">;
  spread: TokenMember<"dimension">;
  inset?: boolean;
};
export type ShadowValue = { layers: Array<ShadowLayer | TokenMember<"shadow">> };

export type BorderValue = {
  color: TokenMember<"color">;
  width: TokenMember<"dimension">;
  style: TokenMember<"strokeStyle">;
};
export type TransitionValue = {
  duration: TokenMember<"duration">;
  delay: TokenMember<"duration">;
  timingFunction: TokenMember<"cubicBezier">;
};
export type GradientStop = { color: TokenMember<"color">; position: TokenMember<"number"> };
export type GradientValue = {
  kind: "linear" | "radial" | "conic";
  angle: string;
  stops: Array<GradientStop | TokenMember<"gradient">>;
};
export type TypographyValue = {
  fontFamily: TokenMember<"fontFamily">;
  fontSize: TokenMember<"dimension">;
  fontWeight: TokenMember<"fontWeight">;
  letterSpacing: TokenMember<"dimension">;
  lineHeight: TokenMember<"number">;
};

export type TokenTypeMap = {
  color: ColorValue;
  dimension: DimensionValue;
  fontFamily: FontFamilyValue;
  fontWeight: FontWeightValue;
  duration: DurationValue;
  cubicBezier: CubicBezierValue;
  number: NumberValue;
  strokeStyle: StrokeStyleValue;
  shadow: ShadowValue;
  border: BorderValue;
  transition: TransitionValue;
  gradient: GradientValue;
  typography: TypographyValue;
};

export type TokenType = keyof TokenTypeMap;
export type TokenLayer = "ref" | "system" | "components";

export type TokenMetadata = {
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
};

export type RawToken<T extends TokenType = TokenType> = TokenMetadata & {
  _kind: "raw";
  $type: T;
  $value: TokenTypeMap[T];
};

export type StampedToken<
  T extends TokenType = TokenType,
  Layer extends TokenLayer = TokenLayer,
> = TokenMetadata & {
  _kind: "stamped";
  $type: T;
  $value: TokenTypeMap[T];
  _path: string[];
  _layer: Layer;
  _alias?: string[];
};

export type TokenScale<
  Key extends string | number = string | number,
  T extends TokenType = TokenType,
  Value extends RawToken<T> | StampedToken<T> = RawToken<T>,
> = Record<Key, Value> & {
  readonly _kind: "scale";
  readonly $type: T;
  readonly _path?: string[];
  readonly _layer?: TokenLayer;
};

export type RefToken<T extends TokenType = TokenType> = StampedToken<T, "ref">;
export type SystemToken<T extends TokenType = TokenType> = StampedToken<T, "system">;
export type CompToken<T extends TokenType = TokenType> = StampedToken<T, "components">;
export type SystemInput<T extends TokenType> = RawToken<T> | RefToken<T>;
export type CompInput<T extends TokenType> = RawToken<T> | RefToken<T> | SystemToken<T>;

export type TokenScaleMetadata<T extends TokenType = TokenType> = {
  path: string[];
  layer: TokenLayer;
  type: T;
  keys: string[];
};
export type TokenEntry<T extends TokenType = TokenType> = TokenMetadata & {
  path: string[];
  $type: T;
  $value: TokenTypeMap[T];
  alias?: string[];
  layer: TokenLayer;
  scale?: TokenScaleMetadata<T>;
};
export type TokenDiagnostic = { path: string[]; message: string };
export type TokenRegistry = Map<string, TokenEntry>;
export type ThemeOverride = Map<string, TokenTypeMap[TokenType]>;
export type DeepPartial<T> =
  T extends RawToken<infer U>
    ? RawToken<U>
    : T extends StampedToken<infer U, infer _L>
      ? RawToken<U>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

export type LogLevel = "info" | "debug";
export type Logger = {
  info(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
};

export type ResolveConfigInput = {
  packageManager: string;
  installCommand: string;
};

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

export type IntrospectionConfigInput = {
  tsConfigPath: string;
  componentsConfigPath: string;
};
export type NamedProps = {
  type: "named";
  name: string;
  sourceFilePath: string;
  checksum: string;
};
export type InlinePropsDependency = {
  name: string;
  sourceFilePath: string;
  checksum: string;
};
export type InlineProps = {
  type: "inline";
  content: string;
  dependencies: InlinePropsDependency[];
};
export type UnverifiedComponentDeclaration = {
  name: string;
  sourceFilePath: string | null;
  props: NamedProps | InlineProps | null;
};
export type ComponentDeclaration = {
  name: string;
  sourceFilePath: string;
  props: NamedProps | InlineProps;
};
export type InterfaceMember = {
  name: string;
  value: string;
  isOptional: boolean;
  isDeprecated: boolean;
  defaultValue: string | null;
  description: string | null;
};
export type Dependency = { sourceFilePath: string; name: string; checksum: string };
export type DictItem = {
  name: string;
  generics: string | null;
  sourceFilePath: string;
  description: string | null;
  isDeprecated: boolean;
  type: "interface" | "enum" | "type";
  value: string | null;
  members: InterfaceMember[];
  dependencies: Dependency[];
  external?: boolean;
  packageName?: string;
};
export type Checksum = string;
export type Dict = Record<Checksum, DictItem>;
export type IntrospectionLog = { message: string; context: Record<string, unknown> };
export type IntrospectionResult = {
  schemaVersion: string;
  componentDeclarations: ComponentDeclaration[];
  dict: Dict;
  warnings: IntrospectionLog[];
};

export type ScaleBinding<T extends TokenType = TokenType> = TokenScale<never, T, StampedToken<T>>;
export type TokenBinding<T extends TokenType = TokenType> = StampedToken<T>;
export type StackComponentOptions = {
  backgroundColor: TokenBinding<"color">;
  gapScale: ScaleBinding<"dimension">;
};
export type BuiltInComponentOptions = {
  Stack?: StackComponentOptions;
  [key: string]: Record<string, unknown> | undefined;
};

export type OutputTarget = "css" | "vanilla-extract" | "typescript" | "typescript-native";
export interface CssOutput {
  target: "css";
  outDir: string;
}
export interface VanillaExtractOutput {
  target: "vanilla-extract";
  outDir: string;
  builtInComponents?: BuiltInComponentOptions | readonly string[];
}
export interface TypeScriptOutput {
  target: "typescript";
  outDir: string;
}
export interface TypeScriptNativeOutput {
  target: "typescript-native";
  outDir: string;
  rootFontSize?: number;
}
export type Output = CssOutput | VanillaExtractOutput | TypeScriptOutput | TypeScriptNativeOutput;
export type OutputFile = { filename: string; content: string };

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

export type Config = {
  registry: TokenRegistry;
  diagnostics: TokenDiagnostic[];
  themes: Record<string, ThemeOverride>;
  output: Output[];
  logLevel: LogLevel;
  resolve?: ResolveConfigInput;
  observability?: NormalizedObservabilityConfig;
  introspection?: IntrospectionConfigInput;
};

export function isRawToken(value: unknown): value is RawToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as RawToken)._kind === "raw"
  );
}
export function isTokenScale(value: unknown): value is TokenScale {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as TokenScale)._kind === "scale"
  );
}
export function isStampedToken(value: unknown): value is StampedToken {
  return (
    typeof value === "object" &&
    value !== null &&
    "_kind" in value &&
    (value as StampedToken)._kind === "stamped"
  );
}
export function isTokenLeaf(value: unknown): value is RawToken | StampedToken {
  return isRawToken(value) || isStampedToken(value);
}
export function pathKey(path: string[]): string {
  return path.join(".");
}
