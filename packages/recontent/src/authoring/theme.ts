import { isRawToken, isStampedToken, pathKey } from "../token-model/guards.js";
import type {
  RawToken,
  StampedToken,
  TokenGroup,
  TokenGroupKey,
  TokenScale,
} from "../token-model/model.js";
import type { ThemeOverride } from "../token-model/registry.js";
import type { TokenType } from "../token-model/values.js";
import { assertWithinMaxDepth } from "./define.js";

type TokenTree = Record<string, unknown>;

/**
 * A theme may replace any token subtree, but a scale replacement must retain
 * the original scale's keys and token type. This also allows constructing the
 * replacement with a fresh `tokens.*Scale()` call. A leaf is either a raw value
 * or a stamped token, which the theme then aliases.
 */
type ThemeInput<T> =
  T extends TokenScale<infer Key, infer Type, infer _Value>
    ? TokenScale<Key, Type, RawToken<Type> | StampedToken<Type>>
    : T extends RawToken<infer Type> | StampedToken<infer Type, infer _Layer>
      ? RawToken<Type> | StampedToken<Type>
      : T extends { readonly _kind: "group" }
        ? | { [Key in Exclude<keyof T, TokenGroupKey>]?: ThemeInput<T[Key]> }
          | TokenGroup<{ [Key in Exclude<keyof T, TokenGroupKey>]?: ThemeInput<T[Key]> }>
        : T extends object
          ? { [Key in keyof T]?: ThemeInput<T[Key]> }
          : never;

type SameKeys<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;

type ValidateThemeInput<Template, Override> =
  Template extends TokenScale<infer ExpectedKeys, infer ExpectedType, infer _>
    ? Override extends TokenScale<infer ActualKeys, infer ActualType, infer _>
      ? SameKeys<ActualKeys, ExpectedKeys> extends true
        ? ActualType extends ExpectedType
          ? Override
          : never
        : never
      : never
    : Template extends RawToken | StampedToken
      ? Override
      : Template extends object
        ? Override extends object
          ? {
              [Key in keyof Override]: Key extends keyof Template
                ? ValidateThemeInput<Template[Key], Override[Key]>
                : Key extends TokenGroupKey
                  ? Override[Key]
                  : never;
            }
          : never
        : never;

function collectTokenPaths(
  node: unknown,
  relativePath: string[] = [],
  paths: Map<string, { path: string[]; type: TokenType }> = new Map(),
  depth = 0,
): Map<string, { path: string[]; type: TokenType }> {
  assertWithinMaxDepth(depth, relativePath);

  if (isRawToken(node) || isStampedToken(node)) {
    paths.set(pathKey(relativePath), {
      path: isStampedToken(node) ? node._path : relativePath,
      type: node.$type,
    });
    return paths;
  }

  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return paths;
  }

  for (const [key, value] of Object.entries(node)) {
    collectTokenPaths(value, [...relativePath, key], paths, depth + 1);
  }

  return paths;
}

function collectOverrides(
  node: unknown,
  relativePath: string[],
  validPaths: Map<string, { path: string[]; type: TokenType }>,
  overrides: ThemeOverride,
  depth = 0,
): void {
  assertWithinMaxDepth(depth, relativePath);

  if (isRawToken(node) || isStampedToken(node)) {
    const key = pathKey(relativePath);
    const target = validPaths.get(key);
    if (!target) {
      throw new Error(`Theme override at "${key}" does not match an existing token path.`);
    }
    if (node.$type !== target.type) {
      throw new Error(
        `Theme override at "${key}" has type "${node.$type}", expected "${target.type}".`,
      );
    }
    overrides.set(
      pathKey(target.path),
      isStampedToken(node) ? { $value: node.$value, alias: node._path } : { $value: node.$value },
    );
    return;
  }

  if (node === undefined) {
    return;
  }

  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    const key = pathKey(relativePath);
    throw new Error(
      `Invalid theme override at "${key}": expected a token from tokens.* or an existing stamped token.`,
    );
  }

  for (const [key, value] of Object.entries(node)) {
    collectOverrides(value, [...relativePath, key], validPaths, overrides, depth + 1);
  }
}

/**
 * `overrides` mirrors `tokens`: pass one layer, or `{ ref, system }` to override
 * several. A stamped token aliases that token instead of copying its value.
 */
export function defineTheme<Tokens extends TokenTree, Overrides extends ThemeInput<Tokens>>(
  tokens: Tokens,
  overrides: Overrides & ValidateThemeInput<Tokens, Overrides>,
): ThemeOverride {
  const validPaths = collectTokenPaths(tokens);
  const themeOverride: ThemeOverride = new Map();
  collectOverrides(overrides, [], validPaths, themeOverride);
  return themeOverride;
}

export type ThemeAxisInput = {
  /** Name of the base/default context. Defaults to `"default"`. */
  default?: string;
  /** Optional description emitted on the DTCG resolver modifier. */
  description?: string;
  /** Non-default contexts for this axis. */
  contexts: Record<string, ThemeOverride>;
};

export type ThemeAxisDefinition = {
  readonly _kind: "theme-axis";
  default: string;
  description?: string;
  contexts: Record<string, ThemeOverride>;
};

export function isThemeOverride(value: unknown): value is ThemeOverride {
  return value instanceof Map;
}

export function isThemeAxisDefinition(value: unknown): value is ThemeAxisDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { _kind?: unknown })._kind === "theme-axis"
  );
}

export function defineThemeAxis(input: ThemeAxisInput): ThemeAxisDefinition {
  if (
    typeof input !== "object" ||
    input === null ||
    typeof input.contexts !== "object" ||
    input.contexts === null ||
    Array.isArray(input.contexts) ||
    isThemeOverride(input.contexts)
  ) {
    throw new Error("defineThemeAxis expects `{ contexts: { ... }, default?, description? }`.");
  }
  return {
    _kind: "theme-axis",
    default: input.default ?? "default",
    ...(input.description !== undefined ? { description: input.description } : {}),
    contexts: { ...input.contexts },
  };
}

export type { ThemeOverride };
