import { isRawToken, isStampedToken, pathKey } from "@recontentapp/core";
import type {
  RawToken,
  StampedToken,
  ThemeOverride,
  TokenScale,
  TokenType,
} from "@recontentapp/core";

type TokenTree = Record<string, unknown>;

/**
 * A theme may replace any token subtree, but a scale replacement must retain
 * the original scale's keys and token type. This also allows constructing the
 * replacement with a fresh `tokens.*Scale()` call.
 */
type ThemeInput<T> =
  T extends TokenScale<infer Key, infer Type, infer _Value>
    ? TokenScale<Key, Type, RawToken<Type> | StampedToken<Type>>
    : T extends RawToken<infer Type> | StampedToken<infer Type, infer _Layer>
      ? RawToken<Type>
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
                : never;
            }
          : never
        : never;

function collectTokenPaths(
  node: unknown,
  relativePath: string[] = [],
): Map<string, { path: string[]; type: TokenType }> {
  const paths = new Map<string, { path: string[]; type: TokenType }>();

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
    for (const [p, token] of collectTokenPaths(value, [...relativePath, key])) {
      paths.set(p, token);
    }
  }

  return paths;
}

function collectOverrides(
  node: unknown,
  relativePath: string[],
  validPaths: Map<string, { path: string[]; type: TokenType }>,
  overrides: ThemeOverride,
): void {
  if (isRawToken(node)) {
    const key = pathKey(relativePath);
    const target = validPaths.get(key);
    if (!target) {
      throw new Error(`Theme override at "${key}" does not match an existing token path.`);
    }
    overrides.set(pathKey(target.path), node.$value);
    return;
  }

  if (typeof node !== "object" || node === null || Array.isArray(node)) {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    collectOverrides(value, [...relativePath, key], validPaths, overrides);
  }
}

export function defineTheme<Tokens extends TokenTree, Overrides extends ThemeInput<Tokens>>(
  tokens: Tokens,
  overrides: Overrides & ValidateThemeInput<Tokens, Overrides>,
): ThemeOverride {
  const validPaths = collectTokenPaths(tokens);
  const themeOverride: ThemeOverride = new Map();

  collectOverrides(overrides, [], validPaths, themeOverride);

  return themeOverride;
}

export type { ThemeOverride };
