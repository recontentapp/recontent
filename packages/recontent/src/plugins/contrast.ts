import { relativeLuminance, toSrgb } from "../color/convert.js";
import { type TokenEntry, type TokenRegistry } from "../token-model/registry.js";
import { resolveValue } from "../token-model/alias.js";
import { type ColorValue } from "../token-model/values.js";
import { type PluginDiagnostic, type RecontentPlugin } from "./types.js";

type ContrastRule = {
  /** A color token, or a group (every color token at or below the key), e.g. `system.color.text`. */
  foreground: string;
  /** A color token, or a group, as for `foreground`. */
  background: string;
  /** Minimum WCAG 2.x contrast ratio. Defaults to 4.5 (AA body text). */
  min?: number;
  /** Defaults to `"error"`, which fails the build. */
  severity?: "error" | "warning";
};

export type ContrastPluginOptions = { rules: ContrastRule[] };

const DEFAULT_MIN = 4.5;

function colorTokensAt(registry: TokenRegistry, key: string): TokenEntry[] {
  const found: TokenEntry[] = [];
  for (const [k, entry] of registry) {
    if (entry.$type === "color" && (k === key || k.startsWith(`${key}.`))) found.push(entry);
  }
  return found;
}

function srgbOf(color: ColorValue): [number, number, number] {
  return toSrgb(color.colorSpace, color.components);
}

/** The WCAG contrast ratio of `fg` rendered over an opaque `bg`, from unrounded values. */
function contrastRatio(fg: ColorValue, bg: ColorValue): number {
  const back = srgbOf(bg);
  const front = srgbOf(fg).map((c, i) => c * fg.alpha + back[i]! * (1 - fg.alpha)) as [
    number,
    number,
    number,
  ];
  const l1 = relativeLuminance(front);
  const l2 = relativeLuminance(back);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Checks WCAG 2.x contrast between groups of color tokens in the base tokens and every theme.
 * A failing pair is an error unless the rule's `severity` is `"warning"`.
 */
export function contrast(options: ContrastPluginOptions): RecontentPlugin {
  return {
    name: "recontent:contrast",
    dependsOn: ["tokens"],
    validate(ctx) {
      const diagnostics: PluginDiagnostic[] = [];
      const themes = [undefined, ...Object.keys(ctx.themes).sort()];

      for (const rule of options.rules) {
        const foregrounds = colorTokensAt(ctx.registry, rule.foreground);
        const backgrounds = colorTokensAt(ctx.registry, rule.background);
        const label = `contrast rule "${rule.foreground}" on "${rule.background}"`;
        const missing = [
          ...(foregrounds.length === 0 ? [rule.foreground] : []),
          ...(backgrounds.length === 0 ? [rule.background] : []),
        ];
        if (missing.length > 0) {
          diagnostics.push({
            severity: "error",
            message: `The ${label} matches no color token: ${missing.map((k) => `"${k}"`).join(", ")}.`,
          });
          continue;
        }

        const min = rule.min ?? DEFAULT_MIN;
        const severity = rule.severity ?? "error";
        for (const fg of foregrounds) {
          for (const bg of backgrounds) {
            if (fg === bg) continue;
            const fgKey = fg.path.join(".");
            const bgKey = bg.path.join(".");
            for (const theme of themes) {
              const where = theme === undefined ? "the base tokens" : `theme "${theme}"`;
              const fgValue = resolveValue(ctx, fg, theme) as ColorValue;
              const bgValue = resolveValue(ctx, bg, theme) as ColorValue;
              if (bgValue.alpha < 1) {
                diagnostics.push({
                  severity: "error",
                  path: bg.path,
                  message: `${bgKey} is translucent in ${where}: the background must be opaque to measure contrast against ${fgKey}.`,
                });
                continue;
              }
              const ratio = contrastRatio(fgValue, bgValue);
              if (ratio < min) {
                diagnostics.push({
                  severity,
                  path: fg.path,
                  message: `${fgKey} on ${bgKey} has contrast ${ratio.toFixed(2)}:1 in ${where}, below ${min}:1.`,
                });
              }
            }
          }
        }
      }
      return diagnostics;
    },
  };
}
