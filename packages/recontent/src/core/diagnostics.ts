import {
  isRawToken,
  isStampedToken,
  isTokenScale,
  type TokenDiagnostic,
  type TokenLayer,
} from "@recontentapp/core";

function tokenFactoryForValue(value: unknown): string {
  if (
    typeof value === "string" &&
    (/^#(?:[0-9a-f]{3,8})$/i.test(value.trim()) ||
      /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i.test(value.trim()))
  ) {
    return "tokens.color(...)";
  }

  if (typeof value === "string" && /^-?\d*\.?\d+(?:px|rem)$/.test(value.trim())) {
    return "tokens.dimension(...)";
  }

  if (typeof value === "number") {
    return "tokens.number(...)";
  }

  if (Array.isArray(value)) {
    return "tokens.fontFamily(...)";
  }

  return "the appropriate tokens.* helper";
}

function diagnostic(path: string[], value: unknown, scale: boolean): TokenDiagnostic {
  const factory = scale
    ? "tokens.colorScale(...) or tokens.dimensionScale(...)"
    : tokenFactoryForValue(value);
  return {
    path,
    message: `Unknown token value at "${path.join(".")}". Use ${factory} instead of an anonymous value.`,
  };
}

function looksLikeScaleObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key));
}

function walk(
  node: unknown,
  path: string[],
  diagnostics: TokenDiagnostic[],
  inScale = false,
): void {
  if (isRawToken(node) || isStampedToken(node)) {
    return;
  }

  if (isTokenScale(node)) {
    for (const [key, value] of Object.entries(node)) {
      walk(value, [...path, key], diagnostics, true);
    }
    return;
  }

  if (typeof node === "object" && node !== null && !Array.isArray(node)) {
    if ("colorSpace" in node || "components" in node) {
      diagnostics.push(diagnostic(path, node, inScale));
      return;
    }

    const childInScale = inScale || looksLikeScaleObject(node as Record<string, unknown>);
    for (const [key, value] of Object.entries(node)) {
      walk(value, [...path, key], diagnostics, childInScale);
    }
    return;
  }

  diagnostics.push(diagnostic(path, node, inScale));
}

export function diagnoseTokenTree(tree: unknown, layer: TokenLayer): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];
  walk(tree, [layer], diagnostics);
  return diagnostics;
}

export function diagnoseTokenTrees(tokens: {
  ref: unknown;
  system: unknown;
  components: unknown;
}): TokenDiagnostic[] {
  return [
    ...diagnoseTokenTree(tokens.ref, "ref"),
    ...diagnoseTokenTree(tokens.system, "system"),
    ...diagnoseTokenTree(tokens.components, "components"),
  ];
}
