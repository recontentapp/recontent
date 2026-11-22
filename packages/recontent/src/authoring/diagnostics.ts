import { isRawToken, isStampedToken, isTokenGroup, isTokenScale } from "../token-model/guards.js";
import { type TokenDiagnostic } from "../token-model/registry.js";
import { type TokenLayer } from "../token-model/model.js";
import { isNumericKey } from "../ts-source.js";
import { assertWithinMaxDepth } from "./define.js";

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

function containsTokenOrGroupValue(node: Record<string, unknown>): boolean {
  for (const value of Object.values(node)) {
    if (isRawToken(value) || isStampedToken(value) || isTokenScale(value) || isTokenGroup(value)) {
      return true;
    }
  }
  return false;
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

  if (typeof value === "string" && /^-?\d*\.?\d+(?:px|rem|em)$/.test(value.trim())) {
    return "tokens.dimension(...)";
  }

  if (typeof value === "string" && /^-?\d*\.?\d+(?:ms|s)$/.test(value.trim())) {
    return "tokens.duration(...)";
  }

  if (typeof value === "number") {
    return "tokens.number(...)";
  }

  if (Array.isArray(value) && value.length === 4 && value.every((v) => typeof v === "number")) {
    return "tokens.cubicBezier(...)";
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
  return keys.length > 0 && keys.every(isNumericKey);
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
    diagnostics.push({
      path: [...path, keys[0]!],
      message: `Token/group names differing only by case at "${path.join(".")}": ${keys.join(", ")}.`,
    });
  }
}

function walk(
  node: unknown,
  path: string[],
  diagnostics: TokenDiagnostic[],
  inScale = false,
  depth = 0,
): void {
  assertWithinMaxDepth(depth, path);

  if (isRawToken(node) || isStampedToken(node)) {
    return;
  }

  if (isTokenScale(node)) {
    checkNameCollisions(node, path, diagnostics);
    for (const [key, value] of Object.entries(node)) {
      walk(value, [...path, key], diagnostics, true, depth + 1);
    }
    return;
  }

  if (typeof node === "object" && node !== null && !Array.isArray(node)) {
    const record = node as Record<string, unknown>;
    if (!isTokenGroup(node) && !containsTokenOrGroupValue(record)) {
      if ("colorSpace" in record || "components" in record) {
        diagnostics.push(diagnostic(path, record, inScale));
        return;
      }

      if (looksLikeCompositeObject(record)) {
        diagnostics.push(diagnostic(path, record, inScale));
        return;
      }
    }

    checkNameCollisions(record, path, diagnostics);
    const childInScale = inScale || looksLikeScaleObject(record);
    for (const [key, value] of Object.entries(record)) {
      walk(value, [...path, key], diagnostics, childInScale, depth + 1);
    }
    return;
  }

  diagnostics.push(diagnostic(path, node, inScale));
}

function diagnoseTokenTree(tree: unknown, layer: TokenLayer): TokenDiagnostic[] {
  const diagnostics: TokenDiagnostic[] = [];
  // Component tokens live at the registry root, so their paths carry no layer prefix.
  walk(tree, layer === "components" ? [] : [layer], diagnostics);
  return diagnostics;
}

export function diagnoseTokenTrees(tokens: {
  ref?: unknown;
  system?: unknown;
  components?: unknown;
}): TokenDiagnostic[] {
  const layers = ["ref", "system", "components"] as const;
  return layers.flatMap((layer) =>
    tokens[layer] === undefined ? [] : diagnoseTokenTree(tokens[layer], layer),
  );
}
