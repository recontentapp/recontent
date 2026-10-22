import type {
  Config,
  // IntrospectionConfigInput,
  LogLevel,
  RawToken,
  RecontentPlugin,
  StampedToken,
  ThemeOverride,
  TokenLayer,
  TokenMetadata,
  TokenRegistry,
  TokenScaleMetadata,
  TokenScale,
  TokenType,
} from "@recontentapp/core";
import { diagnoseTokenTrees } from "./diagnostics.js";
import { isRawToken, isStampedToken, isTokenLeaf, isTokenScale, pathKey } from "@recontentapp/core";
import { withScaleMethods, withStampedTokenMethods, type ChainableMethods } from "./metadata.js";

type TokenTree = Record<string, unknown>;

function metadataFields(source: TokenMetadata): TokenMetadata {
  return {
    ...(source.$description !== undefined ? { $description: source.$description } : {}),
    ...(source.$deprecated !== undefined ? { $deprecated: source.$deprecated } : {}),
    ...(source.$extensions !== undefined ? { $extensions: source.$extensions } : {}),
  };
}

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
    ...metadataFields(token),
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
  const result: Record<string | number, StampedToken<T, Layer>> = Object.fromEntries(
    (Object.entries(scale) as Array<[string, RawToken<T> | StampedToken<T>]>).map(
      ([key, value]) => [key, stampToken(value, [...path, key], layer)],
    ),
  );
  Object.defineProperties(result, {
    _kind: { value: "scale", enumerable: false },
    $type: { value: scale.$type, enumerable: false },
    _path: { value: path, enumerable: false },
    _layer: { value: layer, enumerable: false },
  });
  return withScaleMethods(result, scale) as TokenScale<string | number, T, StampedToken<T, Layer>>;
}

const MAX_TOKEN_TREE_DEPTH = 64;

function assertWithinMaxDepth(depth: number, path: string[]): void {
  if (depth > MAX_TOKEN_TREE_DEPTH) {
    throw new Error(
      `Token tree nesting exceeds ${MAX_TOKEN_TREE_DEPTH} levels at "${path.join(".")}"; check for a self-referencing object.`,
    );
  }
}

function walkAndStamp<Layer extends TokenLayer>(
  input: unknown,
  path: string[],
  layer: Layer,
  depth = 0,
): unknown {
  assertWithinMaxDepth(depth, path);

  if (isTokenScale(input)) {
    return stampScale(input, path, layer);
  }

  if (isTokenLeaf(input)) {
    return stampToken(input, path, layer);
  }

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return input;
  }

  // fromEntries defines own properties, so a "__proto__" key survives to be rejected by collectEntries.
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      walkAndStamp(value, [...path, key], layer, depth + 1),
    ]),
  );
}

const INVALID_NAME_CHARS = /[.{}]/;
const RESERVED_NAMES = new Set(["__proto__", "constructor", "prototype"]);

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
  if (RESERVED_NAMES.has(name)) {
    throw new Error(
      `Invalid token/group name "${name}" at "${[...path, name].join(".")}": "${name}" is a reserved name.`,
    );
  }
}

function collectEntries(
  node: unknown,
  path: string[],
  layer: TokenLayer,
  registry: TokenRegistry,
  scale?: TokenScaleMetadata,
  depth = 0,
): void {
  assertWithinMaxDepth(depth, path);

  if (isTokenScale(node)) {
    const scalePath = node._path ?? path;
    const scaleLayer = node._layer ?? layer;
    const scaleMetadata: TokenScaleMetadata = {
      path: [...scalePath],
      layer: scaleLayer,
      type: node.$type,
      keys: Object.keys(node),
      ...metadataFields(node),
    };

    for (const [key, value] of Object.entries(node)) {
      validateTokenName(key, scalePath);
      collectEntries(value, [...scalePath, key], scaleLayer, registry, scaleMetadata, depth + 1);
    }
    return;
  }

  if (isRawToken(node) || isStampedToken(node)) {
    registry.set(pathKey(path), {
      path,
      $type: node.$type,
      $value: node.$value,
      ...(isStampedToken(node) && node._alias ? { alias: node._alias } : {}),
      layer,
      ...(scale ? { scale } : {}),
      ...metadataFields(node),
    });
    return;
  }

  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    validateTokenName(key, path);
    collectEntries(value, [...path, key], layer, registry, undefined, depth + 1);
  }
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

export type DefineConfigInput = {
  tokens?: {
    ref: TokenTree;
    system: TokenTree;
    components: TokenTree;
  };
  themes?: Record<string, ThemeOverride>;
  plugins?: RecontentPlugin | RecontentPlugin[];
  logLevel?: LogLevel;
  // introspection?: IntrospectionConfigInput;
};

function normalizePlugins(
  plugins: RecontentPlugin | RecontentPlugin[] | undefined,
): RecontentPlugin[] {
  if (!plugins) {
    return [];
  }
  const list = Array.isArray(plugins) ? plugins : [plugins];
  for (const plugin of list) {
    if (typeof plugin !== "object" || plugin === null || typeof plugin.name !== "string") {
      throw new Error(
        "defineConfig's `plugins` must be RecontentPlugin instances (objects with at least a `name` string).",
      );
    }
  }
  return list;
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
  }
  // TODO(introspection): not ready, re-enable the check below together with the other introspection lines.
  // else if (!input.introspection) {
  //   throw new Error("defineConfig requires either tokens or an introspection block.");
  // }

  return {
    registry,
    diagnostics,
    themes: input.themes ?? {},
    plugins: normalizePlugins(input.plugins),
    logLevel: normalizeLogLevel(input.logLevel),
    // introspection: input.introspection,
  };
}
