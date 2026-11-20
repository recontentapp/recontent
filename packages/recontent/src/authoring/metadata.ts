import type { RawToken, StampedToken, TokenLayer } from "../token-model/model.js";
import type { ColorValue, TokenType } from "../token-model/values.js";

export type ChainableMethods<Token> = {
  describe(description: string): Token & ChainableMethods<Token>;
  deprecate(reason?: string): Token & ChainableMethods<Token>;
  extend(namespace: string, value: Record<string, unknown>): Token & ChainableMethods<Token>;
} & (Token extends { $type: "color" }
  ? {
      /** The same color with a different alpha, as a new literal without the metadata or alias. */
      alpha(value: number): RawToken<"color"> & ChainableMethods<RawToken<"color">>;
    }
  : {});

export function assertAlpha(alpha: number): void {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`Invalid alpha: ${alpha}. Expected a number between 0 and 1.`);
  }
}

function attachChainable<
  Token extends {
    $type?: string;
    $value?: unknown;
    $description?: string;
    $deprecated?: boolean | string;
    $extensions?: Record<string, unknown>;
  },
>(token: Token, rebuild: (patch: Partial<Token>) => Token): Token & ChainableMethods<Token> {
  Object.defineProperties(token, {
    describe: {
      enumerable: false,
      value: (description: string) => rebuild({ $description: description } as Partial<Token>),
    },
    deprecate: {
      enumerable: false,
      value: (reason?: string) =>
        rebuild({
          $deprecated: (reason ?? true) as Token["$deprecated"],
        } as Partial<Token>),
    },
    extend: {
      enumerable: false,
      value: (namespace: string, value: Record<string, unknown>) =>
        rebuild({
          $extensions: { ...token.$extensions, [namespace]: value },
        } as Partial<Token>),
    },
  });
  if (token.$type === "color") {
    Object.defineProperty(token, "alpha", {
      enumerable: false,
      value: (alpha: number) => {
        assertAlpha(alpha);
        return withRawTokenMethods({
          _kind: "raw",
          $type: "color",
          $value: { ...(token.$value as ColorValue), alpha },
        });
      },
    });
  }
  return token as Token & ChainableMethods<Token>;
}

export function withRawTokenMethods<T extends TokenType>(
  token: RawToken<T>,
): RawToken<T> & ChainableMethods<RawToken<T>> {
  return attachChainable(token, (patch) => withRawTokenMethods({ ...token, ...patch }));
}

export function withStampedTokenMethods<T extends TokenType, Layer extends TokenLayer>(
  token: StampedToken<T, Layer>,
): StampedToken<T, Layer> & ChainableMethods<StampedToken<T, Layer>> {
  return attachChainable(token, (patch) => withStampedTokenMethods({ ...token, ...patch }));
}

const SCALE_METADATA_KEYS = ["$description", "$deprecated", "$extensions"] as const;

/**
 * Attaches describe/deprecate/extend to a scale. Scale members are its enumerable keys, so
 * metadata and methods are non-enumerable. `source` carries metadata over when re-stamping.
 */
export function withScaleMethods<Scale extends object>(
  scale: Scale,
  source?: Partial<Record<(typeof SCALE_METADATA_KEYS)[number], unknown>>,
): Scale & ChainableMethods<Scale> {
  const metadata: Record<string, unknown> = {};
  for (const key of SCALE_METADATA_KEYS) {
    if (source?.[key] !== undefined) {
      metadata[key] = source[key];
    }
  }
  const rebuild = (patch: Record<string, unknown>) => {
    const copy: Record<string, unknown> = { ...(scale as Record<string, unknown>) };
    for (const key of Reflect.ownKeys(scale)) {
      const descriptor = Object.getOwnPropertyDescriptor(scale, key);
      if (descriptor && !descriptor.enumerable && typeof descriptor.value !== "function") {
        Object.defineProperty(copy, key, descriptor);
      }
    }
    return withScaleMethods(copy as Scale, { ...metadata, ...patch });
  };
  for (const key of SCALE_METADATA_KEYS) {
    if (metadata[key] !== undefined) {
      Object.defineProperty(scale, key, {
        value: metadata[key],
        enumerable: false,
        configurable: true,
      });
    }
  }
  Object.defineProperties(scale, {
    describe: {
      enumerable: false,
      configurable: true,
      value: (description: string) => rebuild({ $description: description }),
    },
    deprecate: {
      enumerable: false,
      configurable: true,
      value: (reason?: string) => rebuild({ $deprecated: reason ?? true }),
    },
    extend: {
      enumerable: false,
      configurable: true,
      value: (namespace: string, value: Record<string, unknown>) =>
        rebuild({
          $extensions: {
            ...(metadata.$extensions as Record<string, unknown> | undefined),
            [namespace]: value,
          },
        }),
    },
  });
  return scale as Scale & ChainableMethods<Scale>;
}
