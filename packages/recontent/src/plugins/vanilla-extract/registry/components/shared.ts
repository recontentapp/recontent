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
 * Renders a typography token reference's five members as object-literal
 * property lines, joined with `indent` so callers can match their own
 * surrounding indentation.
 */
export function typographyProps(ref: string, indent: string): string {
  return [
    `fontFamily: ${ref}.fontFamily`,
    `fontSize: ${ref}.fontSize`,
    `fontWeight: ${ref}.fontWeight`,
    `letterSpacing: ${ref}.letterSpacing`,
    `lineHeight: ${ref}.lineHeight`,
  ].join(`,\n${indent}`);
}

/**
 * Size-variant style body shared by badge/button/dropdown-button: horizontal
 * and vertical padding, a gap, and typography — the shape of a labeled
 * control sized by a single padding+gap+typography contract.
 */
export function paddedTypographySizeStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      paddingLeft: ${fields.horizontalSpacing!.reference},
      paddingRight: ${fields.horizontalSpacing!.reference},
      paddingTop: ${fields.verticalSpacing!.reference},
      paddingBottom: ${fields.verticalSpacing!.reference},
      gap: ${fields.gap!.reference},
      ${typographyProps(fields.typography!.reference, "      ")},
    }`;
}

/**
 * Variant style body shared by icon-button/dropdown-button: background,
 * color, border and typography, with `:hover` and `:disabled` overrides.
 */
export function hoverDisabledVariantStyleBody(fields: Record<string, TokenImport>): string {
  return `{
      backgroundColor: ${fields.backgroundColor!.reference},
      color: ${fields.color!.reference},
      border: ${fields.border!.reference},
      ${typographyProps(fields.typography!.reference, "      ")},
      ":hover": {
        backgroundColor: ${fields.hoverBackgroundColor!.reference},
        color: ${fields.hoverColor!.reference},
        border: ${fields.hoverBorder!.reference},
      },
      ":disabled": {
        backgroundColor: ${fields.disabledBackgroundColor!.reference},
        color: ${fields.disabledColor!.reference},
        border: ${fields.disabledBorder!.reference},
        cursor: "not-allowed",
      },
    }`;
}

/**
 * Status icon color style body shared by banner/toast.
 */
export function statusIconStyleBody(fields: Record<string, TokenImport>): string {
  return `{ color: ${fields.iconColor!.reference} }`;
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
 * Regroups a flat map produced for a `kind: "variants"` contract (keyed
 * `"<contractKey>.<variantName>.<fieldKey>"`) back into a nested
 * `{ variantName: { fieldKey: value } }` shape, in declared field order, so
 * generators can loop over `variants(tokens, "statuses", ["color", ...])`
 * instead of re-deriving the naming convention themselves. Shared between
 * `TokenImport` fields (`groupVariantTokens`) and `kind: "icon"` fields, which
 * carry raw icon names instead of token references (`groupVariantIcons`).
 */
function groupVariants<Value>(
  map: Record<string, Value>,
  contractKey: string,
  fields: readonly string[],
): Record<string, Record<string, Value>> {
  const prefix = `${contractKey}.`;
  const names = new Set<string>();
  for (const key of Object.keys(map)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const variantName = rest.slice(0, rest.lastIndexOf("."));
    if (variantName) names.add(variantName);
  }

  const result: Record<string, Record<string, Value>> = {};
  for (const name of names) {
    const entry: Record<string, Value> = {};
    for (const field of fields) {
      const value = map[`${contractKey}.${name}.${field}`];
      if (value) entry[field] = value;
    }
    result[name] = entry;
  }
  return result;
}

export const groupVariantTokens: (
  tokens: Record<string, TokenImport>,
  contractKey: string,
  fields: readonly string[],
) => Record<string, Record<string, TokenImport>> = groupVariants;

export const groupVariantIcons: (
  icons: Record<string, string>,
  contractKey: string,
  fields: readonly string[],
) => Record<string, Record<string, string>> = groupVariants;
