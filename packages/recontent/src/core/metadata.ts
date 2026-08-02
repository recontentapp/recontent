import type { RawToken, StampedToken, TokenLayer, TokenType } from "@recontentapp/core";

export type ChainableMethods<Token> = {
  describe(description: string): Token;
  deprecate(reason?: string): Token;
  extend(namespace: string, value: Record<string, unknown>): Token;
};

function attachChainable<
  Token extends {
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
        rebuild({ $deprecated: (reason ?? true) as Token["$deprecated"] } as Partial<Token>),
    },
    extend: {
      enumerable: false,
      value: (namespace: string, value: Record<string, unknown>) =>
        rebuild({
          $extensions: { ...token.$extensions, [namespace]: value },
        } as Partial<Token>),
    },
  });
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
