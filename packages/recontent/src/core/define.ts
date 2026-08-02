import { normalizeObservabilityConfig, type ObservabilityConfigInput } from "@recontentapp/core";
import type {
  CompInput,
  CompToken,
  Config,
  IntrospectionConfigInput,
  LogLevel,
  Output,
  RawToken,
  RefToken,
  ResolveConfigInput,
  StampedToken,
  SystemInput,
  SystemToken,
  ThemeOverride,
  TokenLayer,
  TokenRegistry,
  TokenScaleMetadata,
  TokenScale,
  TokenType,
  VanillaExtractOutput,
} from "@recontentapp/core";
import { diagnoseTokenTrees } from "./diagnostics.js";
import { isRawToken, isStampedToken, isTokenLeaf, isTokenScale, pathKey } from "@recontentapp/core";
import { withStampedTokenMethods, type ChainableMethods } from "./metadata.js";
import type { BuiltInComponentOptions, RegistryComponentName } from "../registry/manifest.js";
type TokenTree = Record<string, unknown>;

type StampTree<T, Layer extends TokenLayer> =
  T extends TokenScale<infer Key, infer Token, infer _Value>
    ? TokenScale<Key, Token, StampedToken<Token, Layer>>
    : T extends RawToken<infer U> | StampedToken<infer U, TokenLayer>
      ? StampedToken<U, Layer> & ChainableMethods<StampedToken<U, Layer>>
      : T extends object
        ? { [K in keyof T]: StampTree<T[K], Layer> }
        : T;

function stampToken<T extends TokenType, Layer extends TokenLayer>(
  token: RawToken<T> | StampedToken<T, TokenLayer>,
  path: string[],
  layer: Layer,
): StampedToken<T, Layer> {
  const stamped: StampedToken<T, Layer> = {
    _kind: "stamped",
    $type: token.$type,
    $value: token.$value,
    _path: path,
    _layer: layer,
    ...(token.$description !== undefined ? { $description: token.$description } : {}),
    ...(token.$deprecated !== undefined ? { $deprecated: token.$deprecated } : {}),
    ...(token.$extensions !== undefined ? { $extensions: token.$extensions } : {}),
  };

  if (isStampedToken(token)) {
    stamped._alias = token._path;
  }

  return withStampedTokenMethods(stamped);
}

function stampScale<T extends TokenType, Layer extends TokenLayer>(
  scale: TokenScale<string | number, T>,
  path: string[],
  layer: Layer,
): TokenScale<string | number, T, StampedToken<T, Layer>> {
  const result: Record<string | number, StampedToken<T, Layer>> = {};
  for (const [key, value] of Object.entries(scale) as Array<
    [string, RawToken<T> | StampedToken<T>]
  >) {
    result[key] = stampToken(value, [...path, key], layer);
  }
  Object.defineProperties(result, {
    _kind: { value: "scale", enumerable: false },
    $type: { value: scale.$type, enumerable: false },
    _path: { value: path, enumerable: false },
    _layer: { value: layer, enumerable: false },
  });
  return result as TokenScale<string | number, T, StampedToken<T, Layer>>;
}

function walkAndStamp<Layer extends TokenLayer>(
  input: unknown,
  path: string[],
  layer: Layer,
): unknown {
  if (isTokenScale(input)) {
    return stampScale(input, path, layer);
  }

  if (isTokenLeaf(input)) {
    return stampToken(input, path, layer);
  }

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = walkAndStamp(value, [...path, key], layer);
  }
  return result;
}

const INVALID_NAME_CHARS = /[.{}]/;

function validateTokenName(name: string, path: string[]): void {
  const match = name.match(INVALID_NAME_CHARS);
  if (match) {
    throw new Error(
      `Invalid token/group name "${name}" at "${[...path, name].join(".")}": names cannot contain "${match[0]}".`,
    );
  }
  if (name.startsWith("$")) {
    throw new Error(
      `Invalid token/group name "${name}" at "${[...path, name].join(".")}": names cannot start with "$".`,
    );
  }
}

function collectEntries(
  node: unknown,
  path: string[],
  layer: TokenLayer,
  registry: TokenRegistry,
  scale?: TokenScaleMetadata,
): void {
  if (isTokenScale(node)) {
    const scalePath = node._path ?? path;
    const scaleLayer = node._layer ?? layer;
    const scaleMetadata: TokenScaleMetadata = {
      path: [...scalePath],
      layer: scaleLayer,
      type: node.$type,
      keys: Object.keys(node),
    };

    for (const [key, value] of Object.entries(node)) {
      validateTokenName(key, scalePath);
      collectEntries(value, [...scalePath, key], scaleLayer, registry, scaleMetadata);
    }
    return;
  }

  if (isRawToken(node)) {
    registry.set(pathKey(path), {
      path,
      $type: node.$type,
      $value: node.$value,
      layer,
      ...(scale ? { scale } : {}),
      ...(node.$description !== undefined ? { $description: node.$description } : {}),
      ...(node.$deprecated !== undefined ? { $deprecated: node.$deprecated } : {}),
      ...(node.$extensions !== undefined ? { $extensions: node.$extensions } : {}),
    });
    return;
  }

  if (isStampedToken(node)) {
    registry.set(pathKey(path), {
      path,
      $type: node.$type,
      $value: node.$value,
      ...(node._alias ? { alias: node._alias } : {}),
      layer,
      ...(scale ? { scale } : {}),
      ...(node.$description !== undefined ? { $description: node.$description } : {}),
      ...(node.$deprecated !== undefined ? { $deprecated: node.$deprecated } : {}),
      ...(node.$extensions !== undefined ? { $extensions: node.$extensions } : {}),
    });
    return;
  }

  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    validateTokenName(key, path);
    collectEntries(value, [...path, key], layer, registry);
  }
}

export function flattenTree(
  tree: unknown,
  layer: TokenLayer,
  prefix: string[] = [layer],
): TokenRegistry {
  const registry: TokenRegistry = new Map();
  collectEntries(tree, prefix, layer, registry);
  return registry;
}

export function defineReferenceTokens<T extends TokenTree>(input: T): StampTree<T, "ref"> {
  return walkAndStamp(input, ["ref"], "ref") as StampTree<T, "ref">;
}

export function defineSystemTokens<T extends TokenTree>(input: T): StampTree<T, "system"> {
  return walkAndStamp(input, ["system"], "system") as StampTree<T, "system">;
}

export function defineComponentTokens<T extends TokenTree>(input: T): StampTree<T, "components"> {
  return walkAndStamp(input, [], "components") as StampTree<T, "components">;
}

type VanillaExtractOutputInput = Omit<VanillaExtractOutput, "builtInComponents"> & {
  builtInComponents?: BuiltInComponentOptions | readonly RegistryComponentName[];
};

export type OutputInput = Exclude<Output, VanillaExtractOutput> | VanillaExtractOutputInput;

export type DefineConfigInput = {
  tokens?: {
    ref: TokenTree;
    system: TokenTree;
    components: TokenTree;
  };
  themes?: Record<string, ThemeOverride>;
  output?: OutputInput | OutputInput[];
  logLevel?: LogLevel;
  resolve?: ResolveConfigInput;
  observability?: ObservabilityConfigInput;
  introspection?: IntrospectionConfigInput;
};

function normalizeOutput(output: OutputInput | OutputInput[] | undefined): Output[] {
  if (!output) {
    return [];
  }
  const outputs = Array.isArray(output) ? output : [output];
  return outputs as Output[];
}

function normalizeLogLevel(logLevel: LogLevel | undefined): LogLevel {
  if (logLevel === undefined) {
    return "info";
  }

  if (logLevel !== "info" && logLevel !== "debug") {
    throw new Error(`Invalid logLevel "${logLevel}". Expected "info" or "debug".`);
  }

  return logLevel;
}

export function defineConfig(input: DefineConfigInput): Config {
  const registry: TokenRegistry = new Map();
  const diagnostics = input.tokens ? diagnoseTokenTrees(input.tokens) : [];

  if (input.tokens) {
    collectEntries(input.tokens.ref, ["ref"], "ref", registry);
    collectEntries(input.tokens.system, ["system"], "system", registry);
    collectEntries(input.tokens.components, [], "components", registry);
  } else if (!input.observability && !input.introspection) {
    throw new Error(
      "defineConfig requires either tokens, an observability block, or an introspection block.",
    );
  }

  return {
    registry,
    diagnostics,
    themes: input.themes ?? {},
    output: normalizeOutput(input.output),
    logLevel: normalizeLogLevel(input.logLevel),
    resolve: input.resolve,
    observability: input.observability
      ? normalizeObservabilityConfig(input.observability)
      : undefined,
    introspection: input.introspection,
  };
}

export type { SystemInput, CompInput, RefToken, SystemToken, CompToken };
