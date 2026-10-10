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
  /** A resolver file, token files or directories, as given to `--from`. */
  sources: string[];
  cwd: string;
};

export type DtcgImportResult = {
  source: string;
  stats: DtcgImportStats;
  warnings: string[];
};

/** Generates the text of a `recontent.config.ts` from DTCG token files or a DTCG resolver. */
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
  const contexts = loaded.contexts.map(({ modifier, context, doc }) => ({
    modifier,
    context,
    tokens: flattenDocument(doc, warn),
  }));
  const { themes, skipped: skippedOverrides } = buildThemes(base, convertedByKey, contexts, warn);

  const ref = converted.filter((entry) => entry.layer === "ref");
  const system = converted.filter((entry) => entry.layer === "system");

  return {
    source: emitConfig({ files: loaded.files, ref, system, themes }),
    stats: {
      tokens: converted.length,
      ref: ref.length,
      system: system.length,
      themes: themes.length,
      skipped: skipped.length + skippedOverrides,
    },
    warnings,
  };
}
