import { colorLuminance, relativeLuminance, toSrgb } from "../color/convert.js";
import { pathKey } from "../token-model/guards.js";
import {
  type ThemeAxis,
  type ThemeOverride,
  type TokenEntry,
  type TokenRegistry,
} from "../token-model/registry.js";
import { resolveEntryValue, themeCombinations, themedEntry } from "../token-model/alias.js";
import { type ColorValue } from "../token-model/values.js";
import { type PluginContext, type PluginDiagnostic, type RecontentPlugin } from "./types.js";

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

type ResolvedColor = {
  value: ColorValue;
  srgb: [number, number, number];
  luminance: number;
};

function colorTokensAt(registry: TokenRegistry, key: string): TokenEntry[] {
  const found: TokenEntry[] = [];
  for (const [k, entry] of registry) {
    if (entry.$type === "color" && (k === key || k.startsWith(`${key}.`))) found.push(entry);
  }
  return found;
}

/** The WCAG contrast ratio of `fg` rendered over an opaque `bg`, from unrounded values. */
function contrastRatio(fg: ResolvedColor, bg: ResolvedColor): number {
  const l1 =
    fg.value.alpha >= 1
      ? fg.luminance
      : relativeLuminance([
          fg.srgb[0] * fg.value.alpha + bg.srgb[0] * (1 - fg.value.alpha),
          fg.srgb[1] * fg.value.alpha + bg.srgb[1] * (1 - fg.value.alpha),
          fg.srgb[2] * fg.value.alpha + bg.srgb[2] * (1 - fg.value.alpha),
        ]);
  const l2 = bg.luminance;
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Axes that override `entry` or any token reachable through its alias chains. */
function relevantAxesForColor(
  entry: TokenEntry,
  registry: TokenRegistry,
  axes: readonly ThemeAxis[],
): Set<ThemeAxis> {
  const startKey = pathKey(entry.path);
  const visited = new Set<string>([startKey]);
  const queue = [startKey];

  while (queue.length > 0) {
    const key = queue.shift()!;
    const regEntry = registry.get(key);
    if (!regEntry) continue;

    const views = [regEntry];
    for (const axis of axes) {
      for (const ov of Object.values(axis.contexts)) {
        if (ov.has(key)) views.push(themedEntry(regEntry, ov));
      }
    }
    for (const view of views) {
      if (view.alias) {
        const target = pathKey(view.alias);
        if (!visited.has(target)) {
          visited.add(target);
          queue.push(target);
        }
      }
    }
  }

  const relevant = new Set<ThemeAxis>();
  for (const axis of axes) {
    const touched = Object.values(axis.contexts).some((ov) => {
      for (const k of visited) {
        if (ov.has(k)) return true;
      }
      return false;
    });
    if (touched) relevant.add(axis);
  }
  return relevant;
}

type ComboSpec = { id: string; where: string; override: ThemeOverride | undefined };

/**
 * Checks WCAG 2.x contrast between groups of color tokens in the base tokens and every theme.
 * A failing pair is an error unless the rule's `severity` is `"warning"`.
 */
export function contrast(options: ContrastPluginOptions): RecontentPlugin {
  return {
    name: "recontent:contrast",
    dependsOn: ["tokens"],
    validate(ctx: PluginContext) {
      const diagnostics: PluginDiagnostic[] = [];
      const multiAxis = ctx.themes.length > 1;

      const tokenAxesCache = new Map<string, Set<ThemeAxis>>();
      const axesForToken = (entry: TokenEntry): Set<ThemeAxis> => {
        const key = pathKey(entry.path);
        let axes = tokenAxesCache.get(key);
        if (!axes) {
          axes = relevantAxesForColor(entry, ctx.registry, ctx.themes);
          tokenAxesCache.set(key, axes);
        }
        return axes;
      };

      const comboCache = new Map<string, ComboSpec[]>();
      const combosForPair = (fg: TokenEntry, bg: TokenEntry): ComboSpec[] => {
        const fgAxes = axesForToken(fg);
        const bgAxes = axesForToken(bg);
        const pairAxes = ctx.themes.filter((axis) => fgAxes.has(axis) || bgAxes.has(axis));
        const subsetKey = pairAxes.map((a) => a.name).join("\0");
        let cached = comboCache.get(subsetKey);
        if (!cached) {
          cached = themeCombinations(pairAxes).map((combo) => {
            if (!combo.override) {
              return { id: "", where: "the base tokens", override: undefined };
            }
            const label = multiAxis
              ? pairAxes
                  .filter((axis) => combo.selection[axis.name] !== axis.default)
                  .map((axis) => `${axis.name}=${combo.selection[axis.name]}`)
                  .join(", ")
              : combo.selection[pairAxes[0]!.name]!;
            return { id: label, where: `theme "${label}"`, override: combo.override };
          });
          comboCache.set(subsetKey, cached);
        }
        return cached;
      };

      const colorCache = new Map<string, ResolvedColor>();
      const resolveCached = (
        entry: TokenEntry,
        comboId: string,
        override: ThemeOverride | undefined,
      ): ResolvedColor => {
        const cacheKey = `${comboId}\0${entry.path.join(".")}`;
        let cached = colorCache.get(cacheKey);
        if (!cached) {
          const value = resolveEntryValue(ctx.registry, entry, override) as ColorValue;
          const srgb = toSrgb(value.colorSpace, value.components);
          const luminance = colorLuminance(value.colorSpace, value.components);
          cached = { value, srgb, luminance };
          colorCache.set(cacheKey, cached);
        }
        return cached;
      };

      for (const rule of options.rules) {
        const min = rule.min ?? DEFAULT_MIN;
        const label = `contrast rule "${rule.foreground}" on "${rule.background}"`;
        if (!Number.isFinite(min) || min <= 1 || min > 21) {
          diagnostics.push({
            severity: "error",
            message: `The ${label} has an invalid min ratio (${rule.min}): expected a number in (1, 21].`,
          });
          continue;
        }

        const foregrounds = colorTokensAt(ctx.registry, rule.foreground);
        const backgrounds = colorTokensAt(ctx.registry, rule.background);
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

        const severity = rule.severity ?? "error";
        const reportedTranslucent = new Set<string>();
        let checkedPairs = 0;

        for (const fg of foregrounds) {
          for (const bg of backgrounds) {
            if (fg === bg) continue;
            checkedPairs += 1;
            const fgKey = fg.path.join(".");
            const bgKey = bg.path.join(".");
            for (const { id, where, override } of combosForPair(fg, bg)) {
              const bgColor = resolveCached(bg, id, override);
              if (bgColor.value.alpha < 1) {
                const dedupKey = `${id}\0${bgKey}`;
                if (!reportedTranslucent.has(dedupKey)) {
                  reportedTranslucent.add(dedupKey);
                  diagnostics.push({
                    severity,
                    path: bg.path,
                    message: `${bgKey} is translucent in ${where}: the background must be opaque to measure contrast against ${fgKey}.`,
                  });
                }
                continue;
              }
              const fgColor = resolveCached(fg, id, override);
              const ratio = contrastRatio(fgColor, bgColor);
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

        if (checkedPairs === 0) {
          diagnostics.push({
            severity: "warning",
            message: `The ${label} matched only the same token for foreground and background; no pairs were checked.`,
          });
        }
      }
      return diagnostics;
    },
  };
}
