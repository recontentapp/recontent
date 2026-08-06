import {
  isRawToken,
  isStampedToken,
  isTokenScale,
  type TokenDiagnostic,
  type TokenLayer,
} from "@recontentapp/core";

function looksLikeCompositeObject(value: Record<string, unknown>): string | null {
  if ("layers" in value || "offsetX" in value || "blur" in value) {
    return "tokens.shadow(...)";
  }
  if ("stops" in value) {
    return "tokens.gradient(...)";
  }
  if ("fontSize" in value && "lineHeight" in value) {
    return "tokens.typography(...)";
  }
  if ("timingFunction" in value || ("duration" in value && "delay" in value)) {
    return "tokens.transition(...)";
  }
  if ("width" in value && "style" in value && "color" in value) {
    return "tokens.border(...)";
  }
  if ("dashArray" in value || "lineCap" in value) {
    return "tokens.strokeStyle(...)";
  }
  return null;
}

function tokenFactoryForValue(value: unknown): string {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const composite = looksLikeCompositeObject(value as Record<string, unknown>);
    if (composite) {
      return composite;
    }
  }

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
  const factory = scale ? "a tokens.*Scale(...) helper" : tokenFactoryForValue(value);
  return {
    path,
    message: `Unknown token value at "${path.join(".")}". Use ${factory} instead of an anonymous value.`,
  };
}

function looksLikeScaleObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key));
}

function checkNameCollisions(
  node: Record<string, unknown>,
  path: string[],
  diagnostics: TokenDiagnostic[],
): void {
  const seenByLowercase = new Map<string, string[]>();
  for (const key of Object.keys(node)) {
    const lower = key.toLowerCase();
    const existing = seenByLowercase.get(lower);
    if (existing) {
      existing.push(key);
    } else {
      seenByLowercase.set(lower, [key]);
    }
  }

  for (const [, keys] of seenByLowercase) {
    if (keys.length < 2) continue;
    const uniqueKeys = [...new Set(keys)];
    if (uniqueKeys.length === 1) {
      diagnostics.push({
        path: [...path, uniqueKeys[0]!],
        message: `Token/group name collision at "${[...path, uniqueKeys[0]!].join(".")}": defined more than once.`,
      });
    } else {
      diagnostics.push({
        path: [...path, uniqueKeys[0]!],
        message: `Token/group names differing only by case at "${path.join(".")}": ${uniqueKeys.join(", ")}.`,
      });
    }
  }
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
    checkNameCollisions(node, path, diagnostics);
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

    if (looksLikeCompositeObject(node as Record<string, unknown>)) {
      diagnostics.push(diagnostic(path, node, inScale));
      return;
    }

    checkNameCollisions(node as Record<string, unknown>, path, diagnostics);
    const childInScale = inScale || looksLikeScaleObject(node as Record<string, unknown>);
    for (const [key, value] of Object.entries(node)) {
      walk(value, [...path, key], diagnostics, childInScale);
    }
    return;
  }

  diagnostics.push(diagnostic(path, node, inScale));
}

function diagnoseTokenTree(tree: unknown, layer: TokenLayer): TokenDiagnostic[] {
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
