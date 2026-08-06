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

export type ScaleBinding<T extends TokenType = TokenType> = TokenScale<never, T, StampedToken<T>>;
export type TokenBinding<T extends TokenType = TokenType> = StampedToken<T>;

export type DeepPartial<T> =
  T extends RawToken<infer U>
    ? RawToken<U>
    : T extends StampedToken<infer U, infer _L>
      ? RawToken<U>
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;
