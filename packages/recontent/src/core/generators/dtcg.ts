import { pathKey, type Config, type TokenEntry, type TokenRegistry } from "@recontentapp/core";
import { entryToDtcgNode, setNested } from "./serialize.js";

export type DtcgOutput = Record<string, unknown>;

function isConfig(input: TokenRegistry | Config): input is Config {
  return "registry" in input;
}

function resolveThemedEntry(
  entry: TokenEntry,
  themeOverride: Config["themes"][string],
): TokenEntry {
  if (entry.layer !== "ref") {
    return entry;
  }

  const key = pathKey(entry.path);
  const overridden = themeOverride.get(key);
  if (!overridden) {
    return entry;
  }

  return {
    path: entry.path,
    $type: entry.$type,
    $value: overridden,
    layer: entry.layer,
  };
}

export function generateDtcg(input: TokenRegistry | Config): DtcgOutput {
  const registry = isConfig(input) ? input.registry : input;
  const output: DtcgOutput = {};

  for (const entry of registry.values()) {
    setNested(output, entry.path, entryToDtcgNode(entry));
  }

  return output;
}

export function generateDtcgThemed(config: Config, themeName: string): DtcgOutput {
  const themeOverride = config.themes[themeName];
  if (!themeOverride) {
    throw new Error(
      `Theme "${themeName}" is not defined in the config. Available themes: ${Object.keys(config.themes).join(", ") || "(none)"}`,
    );
  }

  const output: DtcgOutput = {};

  for (const entry of config.registry.values()) {
    const resolved = resolveThemedEntry(entry, themeOverride);
    setNested(output, resolved.path, entryToDtcgNode(resolved));
  }

  return output;
}

export function generateDtcgJson(input: TokenRegistry | Config, space = 2): string {
  return JSON.stringify(generateDtcg(input), null, space);
}

export function generateDtcgThemedJson(config: Config, themeName: string, space = 2): string {
  return JSON.stringify(generateDtcgThemed(config, themeName), null, space);
}
