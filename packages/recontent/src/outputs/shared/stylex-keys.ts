import {
  expandedMembers,
  isExpandedComposite,
  pathKey,
  type TokenTypeMap,
} from "@recontentapp/core";
import type { GeneratorContext } from "./context.js";
import { entryPath } from "./ts-source.js";

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9]/g, "");
}

function capitalizeSegment(segment: string): string {
  const sanitized = sanitizeSegment(segment);
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
}

/**
 * Flattens a token path into a single camelCase identifier, since StyleX's
 * `defineVars` rejects nested objects: `["ref", "color", "gray900"]` becomes
 * `refColorGray900`; `["ref", "spacing", "0-5"]` becomes `refSpacing05`.
 */
function flatKey(path: readonly string[]): string {
  const [first, ...rest] = path;
  const firstSanitized = sanitizeSegment(first ?? "");
  const firstKey = firstSanitized.charAt(0).toLowerCase() + firstSanitized.slice(1);
  return firstKey + rest.map(capitalizeSegment).join("");
}

/**
 * Maps every token identity to its flattened StyleX key up front.
 *
 * Plain entries are keyed by `pathKey(entry.path)`. Expanded composites
 * (`typography`, `transition`) additionally register one key per
 * `cssProperty`, keyed by `"<pathKey>.<cssProperty>"`, since each member
 * becomes its own flat `defineVars` key.
 *
 * Throws on collision: two distinct token identities flattening to the same
 * JS identifier is a naming conflict that must be fixed at the source, since
 * the generated keys are effectively public API for consumers.
 */
export function buildKeyMap(config: GeneratorContext): Map<string, string> {
  const keys = new Map<string, string>();
  const owners = new Map<string, string>();

  function register(id: string, path: readonly string[]): void {
    const key = flatKey(path);
    const owner = owners.get(key);
    if (owner !== undefined && owner !== id) {
      throw new Error(
        `StyleX key collision: token paths "${owner}" and "${id}" both flatten to "${key}". ` +
          "Rename one of these tokens to avoid an ambiguous generated key.",
      );
    }
    owners.set(key, id);
    keys.set(id, key);
  }

  for (const entry of config.registry.values()) {
    const base = [entry.layer, ...entryPath(entry)];
    if (isExpandedComposite(entry.$type)) {
      const type = entry.$type as "typography" | "transition";
      for (const { cssProperty } of expandedMembers(
        type,
        entry.$value as TokenTypeMap[typeof type],
      )) {
        register(`${pathKey(entry.path)}.${cssProperty}`, [...base, cssProperty]);
      }
      continue;
    }
    register(pathKey(entry.path), base);
  }

  return keys;
}
