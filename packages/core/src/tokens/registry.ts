import type { TokenLayer } from "./model.js";
import type { TokenMetadata } from "./model.js";
import type { TokenType, TokenTypeMap } from "./values.js";

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
