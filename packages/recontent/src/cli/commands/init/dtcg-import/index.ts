import { emitConfig } from "./emit.js";
import { flattenDocument, inferMissingTypes } from "./flatten.js";
import { buildLayers } from "./layers.js";
import type { ConvertedToken } from "./layers.js";
import { loadSources } from "./load.js";
import { buildThemes } from "./themes.js";
import { sourceKey } from "./types.js";

export type DtcgImportStats = {
  /** Tokens written to the config (`ref` + `system`). */
  tokens: number;
  ref: number;
  system: number;
  themes: number;
  skipped: number;
};

export type DtcgImportOptions = {
  /** A resolver file, token files or directories, as given to `--dtcg`. */
  sources: string[];
  cwd: string;
};

export type DtcgImportResult = {
  source: string;
  stats: DtcgImportStats;
  warnings: string[];
};

export function generateConfigFromDtcg({ sources, cwd }: DtcgImportOptions): DtcgImportResult {
  const warnings: string[] = [];
  const reported = new Set<string>();
  const warn = (message: string): void => {
    if (reported.has(message)) return;
    reported.add(message);
    warnings.push(message);
  };

  const loaded = loadSources(sources, cwd, warn);

  const base = flattenDocument(loaded.base, warn);
  inferMissingTypes(base, warn);
  const { converted, skipped } = buildLayers(base, warn);
  for (const { token, reason } of skipped) {
    warn(`Skipped "${sourceKey(token.sourcePath)}": ${reason}.`);
  }

  const convertedByKey = new Map<string, ConvertedToken>(
    converted.map((entry) => [sourceKey(entry.token.sourcePath), entry]),
  );
  const modifiers = loaded.modifiers.map((mod) => ({
    name: mod.name,
    default: mod.default,
    ...(mod.description !== undefined ? { description: mod.description } : {}),
    contexts: mod.contexts.map(({ name, doc }) => ({
      name,
      tokens: flattenDocument(doc, warn),
    })),
  }));
  const { axes, skipped: skippedOverrides } = buildThemes(base, convertedByKey, modifiers, warn);
  const themeCount = axes.reduce((sum, axis) => sum + axis.contexts.length, 0);

  const ref = converted.filter((entry) => entry.layer === "ref");
  const system = converted.filter((entry) => entry.layer === "system");

  return {
    source: emitConfig({ files: loaded.files, ref, system, axes }),
    stats: {
      tokens: converted.length,
      ref: ref.length,
      system: system.length,
      themes: themeCount,
      skipped: skipped.length + skippedOverrides,
    },
    warnings,
  };
}
