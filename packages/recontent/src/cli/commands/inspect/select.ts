import type { ComponentInfo, TypeInfo } from "../../../introspection/model.js";
import type { TokenLayer } from "../../../token-model/model.js";
import type { TokenType } from "../../../token-model/values.js";
import type { DocToken } from "../../../snapshot/doc-token.js";
import type { SnapshotThemeAxis } from "../../../snapshot/snapshot.js";

/** Every token type; the keys are checked against `TokenType` in both directions. */
export const TOKEN_TYPES = Object.keys({
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
} satisfies Record<TokenType, 0>) as [TokenType, ...TokenType[]];

/** Every token layer; the keys are checked against `TokenLayer` in both directions. */
export const TOKEN_LAYERS = Object.keys({
  ref: 0,
  system: 0,
  components: 0,
} satisfies Record<TokenLayer, 0>) as [TokenLayer, ...TokenLayer[]];

export const SEARCH_SCOPES = ["tokens", "components", "types"] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

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
  const matches: { candidate: string; score: number }[] = [];
  for (const candidate of new Set(candidates)) {
    if (Math.abs(needle.length - candidate.length) > limit) continue;
    const score = distance(needle, candidate.toLowerCase());
    if (score <= limit) matches.push({ candidate, score });
  }
  return matches
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate))
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

/** What was asked for that does not exist, with the closest things that do. */
type SelectionError = { message: string; input: string; suggestions: string[] };

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
  layer?: TokenLayer;
  type?: string;
  theme?: string;
  deprecated?: boolean;
};

export type ParsedThemeSpec = {
  selection: Record<string, string>;
  label: string;
};

export function parseThemeSpec(
  raw: string,
  axes: readonly SnapshotThemeAxis[],
): { parsed?: ParsedThemeSpec; errors: SelectionError[] } {
  const errors: SelectionError[] = [];
  const trimmed = raw.trim();

  if (axes.length === 0) {
    errors.push(unknown("theme", trimmed, []));
    return { errors };
  }

  if (axes.length === 1 && !trimmed.includes("=") && !trimmed.includes(",")) {
    const axis = axes[0]!;
    if (trimmed === axis.default || axis.contexts.includes(trimmed)) {
      return {
        parsed: {
          selection: { [axis.name]: trimmed },
          label: trimmed,
        },
        errors,
      };
    }
    errors.push(unknown("theme", trimmed, axis.contexts));
    return { errors };
  }

  const axisByName = new Map(axes.map((axis) => [axis.name, axis]));
  const allPairCandidates = axes.flatMap((axis) =>
    [axis.default, ...axis.contexts].map((ctx) => `${axis.name}=${ctx}`),
  );
  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");

  if (parts.length === 0) {
    errors.push(unknown("theme", raw, allPairCandidates));
    return { errors };
  }

  const selection: Record<string, string> = {};
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) {
      // Suggest matching axis=context pairs when a bare context name is passed on multi-axis configs.
      const exactContextAxes = axes.filter(
        (axis) => axis.contexts.includes(part) || axis.default === part,
      );
      if (exactContextAxes.length > 0) {
        const suggestions = exactContextAxes.map((axis) => `${axis.name}=${part}`);
        errors.push({
          message: `Theme selection "${part}" must specify an axis. Did you mean ${suggestions.map((s) => `\`${s}\``).join(", ")}?`,
          input: part,
          suggestions,
        });
      } else {
        errors.push(unknown("theme", part, allPairCandidates));
      }
      continue;
    }

    const axisName = part.slice(0, eq).trim();
    const contextName = part.slice(eq + 1).trim();
    const axis = axisByName.get(axisName);
    if (!axis) {
      errors.push(
        unknown(
          "theme axis",
          axisName,
          axes.map((a) => a.name),
        ),
      );
      continue;
    }
    if (Object.hasOwn(selection, axisName)) {
      errors.push({
        message: `Duplicate theme axis "${axisName}" in --theme.`,
        input: part,
        suggestions: [],
      });
      continue;
    }
    if (contextName !== axis.default && !axis.contexts.includes(contextName)) {
      errors.push(
        unknown(`context on axis "${axisName}"`, contextName, [axis.default, ...axis.contexts]),
      );
      continue;
    }
    selection[axisName] = contextName;
  }

  if (errors.length > 0) {
    return { errors };
  }

  if (axes.length === 1) {
    const axis = axes[0]!;
    const ctx = selection[axis.name] ?? axis.default;
    return { parsed: { selection: { [axis.name]: ctx }, label: ctx }, errors };
  }

  const activePairs = axes
    .filter((axis) => selection[axis.name] !== undefined && selection[axis.name] !== axis.default)
    .map((axis) => `${axis.name}=${selection[axis.name]}`);
  const label = activePairs.length > 0 ? activePairs.join(",") : "default";
  return { parsed: { selection, label }, errors };
}

export function selectTokens(
  tokens: DocToken[],
  themes: readonly SnapshotThemeAxis[],
  query: TokenQuery,
): Selection<DocToken> {
  const errors: SelectionError[] = [];
  if (query.theme !== undefined) {
    errors.push(...parseThemeSpec(query.theme, themes).errors);
  }

  let selected = tokens;
  if (query.paths.length > 0) {
    const selectors = tokenSelectors(tokens);
    for (const path of query.paths) {
      if (!selectors.has(path)) errors.push(unknown("token or group", path, selectors));
    }
    selected = tokens.filter((token) => query.paths.some((path) => matches(path, token.path)));
  }
  if (query.layer !== undefined) {
    selected = selected.filter((token) => token.layer === query.layer);
  }
  if (query.type !== undefined) {
    if (!(TOKEN_TYPES as readonly string[]).includes(query.type))
      errors.push(unknown("token type", query.type, TOKEN_TYPES));
    selected = selected.filter((token) => token.type === query.type);
  }
  if (query.deprecated) selected = selected.filter((token) => token.deprecated);
  return { selected, errors };
}

export function selectComponents(
  components: ComponentInfo[],
  query: { names: string[]; category?: string; deprecated?: boolean; props?: string[] },
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
  if (query.category !== undefined) {
    const categories = [
      ...new Set(
        components.flatMap((component) => (component.category ? [component.category] : [])),
      ),
    ];
    const needle = query.category.toLowerCase();
    const matched = categories.find((category) => category.toLowerCase() === needle);
    if (matched === undefined) {
      errors.push(unknown("category", query.category, categories));
      selected = [];
    } else {
      selected = selected.filter((component) => component.category === matched);
    }
  }
  if (query.deprecated) selected = selected.filter((component) => component.deprecated);

  if (query.props?.length) {
    if (query.names.length === 0) {
      errors.push({
        message: "Showing only some props needs a component name.",
        input: "--props",
        suggestions: [],
      });
    } else if (errors.length === 0) {
      // Own and inherited alike: any of them can be asked for.
      const known = new Set(
        selected.flatMap((component) => [
          ...component.props.map((prop) => prop.name),
          ...component.inherits.flatMap((group) => group.props),
        ]),
      );
      for (const prop of query.props) {
        if (!known.has(prop)) errors.push(unknown("prop", prop, known));
      }
    }
  }
  return { selected, errors };
}

/** A type is asked for by its id or, when it has a twin elsewhere in the project, by its bare name. */
export function selectTypes(
  types: TypeInfo[],
  query: { names: string[]; deprecated?: boolean },
): Selection<TypeInfo> {
  const errors: SelectionError[] = [];
  let selected = types;
  if (query.names.length > 0) {
    const selectors = new Set(types.flatMap((type) => [type.id, type.name]));
    for (const name of query.names) {
      if (!selectors.has(name)) errors.push(unknown("type", name, selectors));
    }
    selected = types.filter((type) =>
      query.names.some((name) => name === type.id || name === type.name),
    );
  }
  if (query.deprecated) selected = selected.filter((type) => type.deprecated);
  return { selected, errors };
}

export type Hit<T> = { item: T; matchedIn: string[] };

export type SearchResult = {
  tokens: Hit<DocToken>[];
  components: Hit<ComponentInfo>[];
  types: Hit<TypeInfo>[];
  /** Only when nothing matched: names a typo could have meant. */
  suggestions: string[];
};

/** What is searched, as `[label, text]`; the label of the item's own name or path comes first. */
type Field = [label: string, text: string | undefined];

function tokenFields(token: DocToken): Field[] {
  return [
    ["path", token.path],
    ["css variable", token.cssVar],
    ["alias", token.alias],
    ["description", token.description],
    ["deprecated", typeof token.deprecated === "string" ? token.deprecated : undefined],
    ...Object.entries(token.values).map(
      ([name, value]): Field => [name === "default" ? "value" : `value (${name})`, value],
    ),
  ];
}

function componentFields(component: ComponentInfo): Field[] {
  return [
    ["name", component.name],
    ["category", component.category],
    ["description", component.description],
    ["usage", component.usage],
    ["deprecated", typeof component.deprecated === "string" ? component.deprecated : undefined],
    ...component.props.flatMap((prop): Field[] => [
      [`prop ${prop.name}`, prop.name],
      [`prop ${prop.name}`, prop.description],
      ...(prop.values ?? []).map((value): Field => [`prop ${prop.name}`, String(value)]),
    ]),
  ];
}

function typeFields(type: TypeInfo): Field[] {
  return [
    ["id", type.id],
    ["description", type.description],
    ["usage", type.usage],
    ["deprecated", typeof type.deprecated === "string" ? type.deprecated : undefined],
    ...(type.members ?? []).flatMap((member): Field[] => [
      [`member ${member.name}`, member.name],
      [`member ${member.name}`, member.description],
    ]),
    ...(type.values ?? []).map((value): Field => ["value", String(value)]),
  ];
}

/** Every item with at least one field containing a query, name hits first, otherwise in the original order. */
function search<T>(items: T[], queries: string[], fields: (item: T) => Field[]): Hit<T>[] {
  const nameHits: Hit<T>[] = [];
  const otherHits: Hit<T>[] = [];
  for (const item of items) {
    const itemFields = fields(item);
    const matchedIn = new Set<string>();
    for (const [label, text] of itemFields) {
      const lower = text?.toLowerCase();
      if (lower !== undefined && queries.some((query) => lower.includes(query))) {
        matchedIn.add(label);
      }
    }
    if (matchedIn.size === 0) continue;
    const hit: Hit<T> = { item, matchedIn: [...matchedIn] };
    const nameLabel = itemFields[0]?.[0];
    if (nameLabel !== undefined && matchedIn.has(nameLabel)) nameHits.push(hit);
    else otherHits.push(hit);
  }
  return [...nameHits, ...otherHits];
}

/** Case-insensitive substring search over everything `inspect` shows; an item matches when any query does. */
export function searchSnapshot(
  snapshot: { tokens: DocToken[]; components: ComponentInfo[]; types: TypeInfo[] },
  queries: string[],
  scope?: SearchScope[],
): SearchResult {
  const needles = queries.map((query) => query.toLowerCase());
  const active = new Set<SearchScope>(scope?.length ? scope : SEARCH_SCOPES);
  const result: SearchResult = {
    tokens: active.has("tokens") ? search(snapshot.tokens, needles, tokenFields) : [],
    components: active.has("components")
      ? search(snapshot.components, needles, componentFields)
      : [],
    types: active.has("types") ? search(snapshot.types, needles, typeFields) : [],
    suggestions: [],
  };
  if (result.tokens.length + result.components.length + result.types.length === 0) {
    const candidates = [
      ...(active.has("tokens") ? snapshot.tokens.flatMap((token) => token.path.split(".")) : []),
      ...(active.has("components") ? snapshot.components.map((component) => component.name) : []),
      ...(active.has("types") ? snapshot.types.map((type) => type.name) : []),
    ];
    result.suggestions = [
      ...new Set(queries.flatMap((query) => closestMatches(query, candidates))),
    ];
  }
  return result;
}
