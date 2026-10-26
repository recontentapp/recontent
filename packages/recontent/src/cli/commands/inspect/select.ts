import type { ComponentInfo, TokenType } from "@recontentapp/core";
import type { DocToken } from "../../../plugins/shared/doc-token.js";

/** Every token type; the keys are checked against `TokenType` in both directions. */
const TOKEN_TYPES = Object.keys({
  color: 0,
  dimension: 0,
  fontFamily: 0,
  fontWeight: 0,
  duration: 0,
  cubicBezier: 0,
  number: 0,
  strokeStyle: 0,
  shadow: 0,
  border: 0,
  transition: 0,
  gradient: 0,
  typography: 0,
} satisfies Record<TokenType, 0>);

function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        previous[j]! + 1,
        row[j - 1]! + 1,
        previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }
  return previous[b.length]!;
}

/** Up to three candidates within a typo's reach of `input`, closest first. */
export function closestMatches(input: string, candidates: Iterable<string>): string[] {
  const needle = input.toLowerCase();
  const limit = Math.max(2, Math.floor(needle.length * 0.3));
  return [...new Set(candidates)]
    .map((candidate) => ({ candidate, score: distance(needle, candidate.toLowerCase()) }))
    .filter(({ score }) => score <= limit)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

/** What was asked for that does not exist, with the closest things that do. */
export type SelectionError = { message: string; input: string; suggestions: string[] };

export type Selection<T> = { selected: T[]; errors: SelectionError[] };

function unknown(kind: string, input: string, candidates: Iterable<string>): SelectionError {
  const suggestions = closestMatches(input, candidates);
  const hint =
    suggestions.length > 0 ? ` Did you mean ${suggestions.map((m) => `\`${m}\``).join(", ")}?` : "";
  return { message: `No ${kind} matches "${input}".${hint}`, input, suggestions };
}

/** A selector names an exact item or, followed by `.`, everything beneath it. */
function matches(selector: string, name: string): boolean {
  return name === selector || name.startsWith(`${selector}.`);
}

/** Every token path and every path prefix (group), the things `inspect tokens` accepts. */
function tokenSelectors(tokens: DocToken[]): Set<string> {
  const selectors = new Set<string>();
  for (const token of tokens) {
    const segments = token.path.split(".");
    for (let end = 1; end <= segments.length; end++)
      selectors.add(segments.slice(0, end).join("."));
  }
  return selectors;
}

export type TokenQuery = {
  paths: string[];
  type?: string;
  theme?: string;
  deprecated?: boolean;
};

export function selectTokens(
  tokens: DocToken[],
  themes: string[],
  query: TokenQuery,
): Selection<DocToken> {
  const errors: SelectionError[] = [];
  if (query.theme !== undefined && !themes.includes(query.theme)) {
    errors.push(unknown("theme", query.theme, themes));
  }

  let selected = tokens;
  if (query.paths.length > 0) {
    const selectors = tokenSelectors(tokens);
    for (const path of query.paths) {
      if (!selectors.has(path)) errors.push(unknown("token or group", path, selectors));
    }
    selected = tokens.filter((token) => query.paths.some((path) => matches(path, token.path)));
  }
  if (query.type !== undefined) {
    if (!TOKEN_TYPES.includes(query.type))
      errors.push(unknown("token type", query.type, TOKEN_TYPES));
    selected = selected.filter((token) => token.type === query.type);
  }
  if (query.deprecated) selected = selected.filter((token) => token.deprecated);
  return { selected, errors };
}

export function selectComponents(
  components: ComponentInfo[],
  query: { names: string[]; deprecated?: boolean },
): Selection<ComponentInfo> {
  const errors: SelectionError[] = [];
  let selected = components;
  if (query.names.length > 0) {
    const names = components.map((component) => component.name);
    const selectors = new Set(names.flatMap((name) => [name, name.split(".")[0]!]));
    for (const name of query.names) {
      if (!selectors.has(name)) errors.push(unknown("component", name, selectors));
    }
    selected = components.filter((component) =>
      query.names.some((name) => matches(name, component.name)),
    );
  }
  if (query.deprecated) selected = selected.filter((component) => component.deprecated);
  return { selected, errors };
}
