import { componentArtifactPath } from "../paths.js";
import type {
  BreakpointBinding,
  ComponentOutput,
  ComponentSourceFiles,
  ScaleImport,
  TokenImport,
} from "../types.js";

export function vanillaExtractComponentOutput(
  id: string,
  name: string,
  generateSources: (
    scales: Record<string, ScaleImport>,
    breakpoints: readonly BreakpointBinding[] | undefined,
    tokens: Record<string, TokenImport>,
    focusRingColor: TokenImport | undefined,
    icons: Record<string, string>,
  ) => ComponentSourceFiles,
  runtimeDependencies?: Record<string, string>,
): ComponentOutput {
  return {
    runtimeDependencies: {
      "@vanilla-extract/css": "^1.17.4",
      react: ">=18",
      ...runtimeDependencies,
    },
    generate: ({ scales, breakpoints, tokens, focusRingColor, icons }) => {
      const sources = generateSources(scales, breakpoints, tokens, focusRingColor, icons);
      return [
        {
          filename: componentArtifactPath(id, name, ".gen.css.ts"),
          content: sources.styles,
        },
        {
          filename: componentArtifactPath(id, name, ".gen.tsx"),
          content: sources.component,
        },
      ];
    },
  };
}

/**
 * Focus-ring declarations for a root interactive element. Returns "" when the
 * output has no `focusRingColor`, so unconfigured projects emit no focus CSS.
 */
export function focusRingBlock(
  focusRingColor: TokenImport | undefined,
  options: { selector?: string; inset?: boolean } = {},
): string {
  if (!focusRingColor) return "";
  const selector = options.selector ?? ":focus-visible";
  const inset = options.inset ? "inset " : "";
  return `"${selector}": {
    outline: "none",
    boxShadow: \`${inset}0 0 0 2px \${${focusRingColor.reference}}\`,
  },`;
}

/**
 * Regroups the flat `tokens` map produced for a `kind: "variants"` contract
 * (keyed `"<contractKey>.<variantName>.<fieldKey>"`) back into a nested
 * `{ variantName: { fieldKey: TokenImport } }` shape, in declared field order,
 * so generators can loop over `variants(tokens, "statuses", ["color", ...])`
 * instead of re-deriving the naming convention themselves.
 */
export function groupVariantTokens(
  tokens: Record<string, TokenImport>,
  contractKey: string,
  fields: readonly string[],
): Record<string, Record<string, TokenImport>> {
  const prefix = `${contractKey}.`;
  const names = new Set<string>();
  for (const key of Object.keys(tokens)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const variantName = rest.slice(0, rest.lastIndexOf("."));
    if (variantName) names.add(variantName);
  }

  const result: Record<string, Record<string, TokenImport>> = {};
  for (const name of names) {
    const entry: Record<string, TokenImport> = {};
    for (const field of fields) {
      const token = tokens[`${contractKey}.${name}.${field}`];
      if (token) entry[field] = token;
    }
    result[name] = entry;
  }
  return result;
}

/**
 * Like `groupVariantTokens`, but for a variant's `kind: "icon"` fields
 * (raw icon names, not token references).
 */
export function groupVariantIcons(
  icons: Record<string, string>,
  contractKey: string,
  fields: readonly string[],
): Record<string, Record<string, string>> {
  const prefix = `${contractKey}.`;
  const names = new Set<string>();
  for (const key of Object.keys(icons)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const variantName = rest.slice(0, rest.lastIndexOf("."));
    if (variantName) names.add(variantName);
  }

  const result: Record<string, Record<string, string>> = {};
  for (const name of names) {
    const entry: Record<string, string> = {};
    for (const field of fields) {
      const icon = icons[`${contractKey}.${name}.${field}`];
      if (icon) entry[field] = icon;
    }
    result[name] = entry;
  }
  return result;
}
