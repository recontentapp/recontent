import type { TokenLayer } from "./model.js";
import type { TokenMetadata } from "./model.js";
import type { TokenType, TokenTypeMap } from "./values.js";

export type TokenScaleMetadata<T extends TokenType = TokenType> = TokenMetadata & {
  path: string[];
  layer: TokenLayer;
  type: T;
  keys: string[];
};
export type TokenGroupMetadata = TokenMetadata & {
  path: string[];
  layer: TokenLayer;
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
/** Metadata of the plain groups made by `tokens.group(...)`, keyed by path. */
export type TokenGroups = Map<string, TokenGroupMetadata>;
/** A theme's replacement for one token: a literal, or an alias (with `$value` snapshotting its target). */
export type ThemeValue = { $value: TokenTypeMap[TokenType]; alias?: string[] };
export type ThemeOverride = Map<string, ThemeValue>;

/** One orthogonal axis of variation (maps 1:1 to a DTCG 2025.10 Resolver modifier). */
export type ThemeAxis = {
  name: string;
  default: string;
  description?: string;
  contexts: Record<string, ThemeOverride>;
};

/** Selects active context(s): a context name when 1 axis exists, or `{ [axis]: context }`. */
export type ThemeSelection = string | Record<string, string>;
