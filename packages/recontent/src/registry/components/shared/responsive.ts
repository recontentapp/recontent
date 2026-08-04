import type { BreakpointBinding } from "../../types.js";

/**
 * Emits a single vanilla-extract `style()` declaration for a responsive prop:
 * the base value applied unconditionally, then ascending `@media` blocks each
 * reading their own custom property with a fallback chain through every
 * lower breakpoint. This is the CSS half of a responsive prop; components
 * pair it with `responsiveVars(...)` (from the generated `responsive.gen.ts`)
 * to compute the custom properties themselves.
 *
 * `cssVarPrefix` must match the prefix passed to `responsiveVars(...)` in the
 * component body — it is not derived here to keep both call sites visible at
 * their definition.
 */
export function responsiveRule(
  exportName: string,
  cssVarPrefix: string,
  cssProps: readonly string[],
  breakpoints: readonly BreakpointBinding[],
): string {
  const varName = (breakpointName: string) => `--${cssVarPrefix}-${breakpointName}`;
  const declarations = (expr: string, indent: string) =>
    cssProps.map((cssProp) => `${indent}${cssProp}: "${expr}",`).join("\n");

  const baseExpr = `var(${varName(breakpoints[0]!.name)})`;
  const baseBlock = declarations(baseExpr, "  ");

  let chain = baseExpr;
  const mediaEntries: string[] = [];
  for (const breakpoint of breakpoints.slice(1)) {
    chain = `var(${varName(breakpoint.name)}, ${chain})`;
    mediaEntries.push(
      `    ${JSON.stringify(breakpoint.query)}: {\n${declarations(chain, "      ")}\n    },`,
    );
  }

  const mediaBlock =
    mediaEntries.length > 0 ? `\n  "@media": {\n${mediaEntries.join("\n")}\n  }` : "";

  return `export const ${exportName} = style({\n${baseBlock}${mediaBlock}\n});`;
}
