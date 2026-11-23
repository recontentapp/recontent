import type { TokenType, TokenTypeMap } from "./values.js";

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
> = Record<Key, Value> &
  TokenMetadata & {
    readonly _kind: "scale";
    readonly $type: T;
    readonly _path?: string[];
    readonly _layer?: TokenLayer;
    describe(description: string): TokenScale<Key, T, Value>;
    deprecate(reason?: string): TokenScale<Key, T, Value>;
    extend(namespace: string, value: Record<string, unknown>): TokenScale<Key, T, Value>;
  };

/** Keys a group carries besides its children. */
export type TokenGroupKey = "_kind" | "describe" | "deprecate" | "extend" | keyof TokenMetadata;

/** A plain group of tokens with metadata, made by `tokens.group(...)`. */
export type TokenGroup<Tree extends object = object> = Tree &
  TokenMetadata & {
    readonly _kind: "group";
    describe(description: string): TokenGroup<Tree>;
    deprecate(reason?: string): TokenGroup<Tree>;
    extend(namespace: string, value: Record<string, unknown>): TokenGroup<Tree>;
  };

export type ScaleBinding<T extends TokenType = TokenType> = TokenScale<never, T, StampedToken<T>>;
export type TokenBinding<T extends TokenType = TokenType> = StampedToken<T>;
