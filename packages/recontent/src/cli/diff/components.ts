import type {
  ComponentInfo,
  InheritedProps,
  PropInfo,
  TypeInfo,
  TypeParameterInfo,
} from "@recontentapp/core";
import type { Introspected } from "../../snapshot.js";

type Literal = string | number | boolean;

type PropChangeKind =
  | "added"
  | "removed"
  | "required"
  | "optional"
  | "type"
  | "values"
  | "default"
  | "deprecated";

export type Change =
  | {
      kind: "prop";
      name: string;
      change: PropChangeKind;
      from?: unknown;
      to?: unknown;
      breaking: boolean;
    }
  /** Props `name` used to provide that are gone, all of them when the whole entry was dropped. */
  | { kind: "inherits"; name: string; props: string[]; breaking: true }
  | {
      kind: "typeParameters";
      from?: TypeParameterInfo[];
      to?: TypeParameterInfo[];
      breaking: boolean;
    }
  | { kind: "deprecated"; from?: true | string; to?: true | string; breaking: false }
  /** Types only. */
  | { kind: "kind"; from: TypeInfo["kind"]; to: TypeInfo["kind"]; breaking: true }
  | { kind: "values"; from: Literal[]; to: Literal[]; breaking: boolean }
  /** A type that has neither members nor values (a function type, say) can only be compared as written. */
  | { kind: "definition"; from: string; to: string; breaking: true };

type EntityDiff = { name: string; changes: Change[] };

export type EntitiesDiff<T> = { added: T[]; removed: T[]; changed: EntityDiff[] };

export type ComponentsDiff = {
  components: EntitiesDiff<ComponentInfo>;
  types: EntitiesDiff<TypeInfo>;
};

// Types are written by hand, so layout is not a change.
function normalize(type: string): string {
  return type.replace(/\s+/g, " ").trim();
}

function sameSet(a: Literal[], b: Literal[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function diffProp(base: PropInfo, head: PropInfo): Change[] {
  const changes: Change[] = [];
  const push = (change: PropChangeKind, breaking: boolean, from?: unknown, to?: unknown) =>
    changes.push({ kind: "prop", name: head.name, change, from, to, breaking });

  if (base.required !== head.required) {
    push(head.required ? "required" : "optional", head.required);
  }

  if (base.values && head.values) {
    if (!sameSet(base.values, head.values)) {
      push(
        "values",
        base.values.some((value) => !head.values!.includes(value)),
        base.values,
        head.values,
      );
    }
  } else {
    // A union of literals that stops being one is as unclassifiable as any other rewrite.
    const from = normalize(base.resolved ?? base.type);
    const to = normalize(head.resolved ?? head.type);
    if (from !== to) push("type", true, from, to);
  }

  if (base.defaultValue !== head.defaultValue) {
    push("default", false, base.defaultValue, head.defaultValue);
  }
  if (base.deprecated !== head.deprecated) {
    push("deprecated", false, base.deprecated, head.deprecated);
  }
  return changes;
}

/** Shared by component props and type members. */
function diffProps(base: PropInfo[], head: PropInfo[]): Change[] {
  const baseByName = new Map(base.map((prop) => [prop.name, prop]));
  const headByName = new Map(head.map((prop) => [prop.name, prop]));
  const changes: Change[] = [];

  for (const prop of head) {
    const before = baseByName.get(prop.name);
    if (before) changes.push(...diffProp(before, prop));
    else {
      changes.push({ kind: "prop", name: prop.name, change: "added", breaking: prop.required });
    }
  }
  for (const prop of base) {
    if (!headByName.has(prop.name)) {
      changes.push({ kind: "prop", name: prop.name, change: "removed", breaking: true });
    }
  }
  return changes;
}

function diffInherits(
  base: InheritedProps[] = [],
  head: InheritedProps[] = [],
  ownProps: PropInfo[] = [],
): Change[] {
  const headByName = new Map(head.map((entry) => [entry.name, entry]));
  const own = new Set(ownProps.map((prop) => prop.name));
  const changes: Change[] = [];
  for (const entry of base) {
    const kept = new Set(headByName.get(entry.name)?.props);
    // A prop that moved to the declared ones is still there.
    const dropped = entry.props.filter((name) => !kept.has(name) && !own.has(name));
    if (dropped.length > 0)
      changes.push({ kind: "inherits", name: entry.name, props: dropped, breaking: true });
  }
  return changes;
}

function diffTypeParameters(
  base: TypeParameterInfo[] = [],
  head: TypeParameterInfo[] = [],
): Change[] {
  const baseByName = new Map(base.map((param) => [param.name, param]));
  const headByName = new Map(head.map((param) => [param.name, param]));
  const breaking =
    base.some((param) => !headByName.has(param.name)) ||
    head.some((param) => {
      const before = baseByName.get(param.name);
      return before ? before.constraint !== param.constraint : param.default === undefined;
    });
  const changed =
    base.length !== head.length ||
    head.some((param) => {
      const before = baseByName.get(param.name);
      return !before || before.constraint !== param.constraint || before.default !== param.default;
    });
  return changed ? [{ kind: "typeParameters", from: base, to: head, breaking }] : [];
}

function diffDeprecated(base: ComponentInfo | TypeInfo, head: ComponentInfo | TypeInfo): Change[] {
  return base.deprecated === head.deprecated
    ? []
    : [{ kind: "deprecated", from: base.deprecated, to: head.deprecated, breaking: false }];
}

function diffComponent(base: ComponentInfo, head: ComponentInfo): Change[] {
  return [
    ...diffProps(base.props, head.props),
    ...diffInherits(base.inherits, head.inherits, head.props),
    ...diffTypeParameters(base.typeParameters, head.typeParameters),
    ...diffDeprecated(base, head),
  ];
}

function diffType(base: TypeInfo, head: TypeInfo): Change[] {
  const changes: Change[] = [];
  if (base.kind !== head.kind) {
    changes.push({ kind: "kind", from: base.kind, to: head.kind, breaking: true });
  }

  // `members` and `values` carry the meaning; `definition` only matters when neither does.
  if (base.members && head.members) {
    changes.push(...diffProps(base.members, head.members));
  } else if (base.values && head.values) {
    if (!sameSet(base.values, head.values)) {
      changes.push({
        kind: "values",
        from: base.values,
        to: head.values,
        breaking: base.values.some((value) => !head.values!.includes(value)),
      });
    }
  } else if (normalize(base.definition) !== normalize(head.definition)) {
    changes.push({
      kind: "definition",
      from: base.definition,
      to: head.definition,
      breaking: true,
    });
  }

  changes.push(
    ...diffInherits(base.inherits, head.inherits, head.members),
    ...diffTypeParameters(base.typeParameters, head.typeParameters),
    ...diffDeprecated(base, head),
  );
  return changes;
}

function diffEntities<T>(
  base: T[],
  head: T[],
  key: (entity: T) => string,
  diff: (base: T, head: T) => Change[],
): EntitiesDiff<T> {
  const baseByKey = new Map(base.map((entity) => [key(entity), entity]));
  const headByKey = new Map(head.map((entity) => [key(entity), entity]));
  const changed: EntityDiff[] = [];
  for (const [name, entity] of headByKey) {
    const before = baseByKey.get(name);
    if (!before) continue;
    const changes = diff(before, entity);
    if (changes.length > 0) changed.push({ name, changes });
  }
  return {
    added: head.filter((entity) => !baseByKey.has(key(entity))),
    removed: base.filter((entity) => !headByKey.has(key(entity))),
    changed,
  };
}

/** Components are matched by name, types by id, props and members by name. A rename is a removal plus an addition. */
export function diffComponents(base: Introspected, head: Introspected): ComponentsDiff {
  return {
    components: diffEntities(base.components, head.components, (c) => c.name, diffComponent),
    types: diffEntities(base.types, head.types, (t) => t.id, diffType),
  };
}

/** Removing a component or type, and each breaking change to one that stays. */
export function countEntityBreakingChanges(diff: EntitiesDiff<unknown>): number {
  return (
    diff.removed.length +
    diff.changed.reduce(
      (total, entity) => total + entity.changes.filter((change) => change.breaking).length,
      0,
    )
  );
}

export function countComponentBreakingChanges(diff: ComponentsDiff): number {
  return countEntityBreakingChanges(diff.components) + countEntityBreakingChanges(diff.types);
}
