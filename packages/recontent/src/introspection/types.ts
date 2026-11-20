import path from "node:path";
import type { ComponentInfo, TypeInfo, TypeParameterInfo } from "./model.js";
import ts from "typescript";
import { resolveAlias, type Analysis } from "./components.js";
import { jsDoc } from "./jsdoc.js";
import {
  declaredTypeNode,
  describeMembers,
  inSourceOrder,
  isExternal,
  literalValues,
  oneLine,
  printer,
} from "./props.js";

type TypeDeclaration = ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration;

/**
 * The project types met so far. Until `finishTypes` runs, a type's id is
 * `name (path)`, which never collides, and references hold those ids.
 */
export type TypeStore = {
  root: string;
  ids: Map<ts.Symbol, string>;
  types: TypeInfo[];
  /** Types seen declaring a prop, collected or not, by id. */
  declarers: Map<string, { symbol: ts.Symbol; declaration: TypeDeclaration }>;
};

export function createTypeStore(root: string): TypeStore {
  return { root, ids: new Map(), types: [], declarers: new Map() };
}

function isTypeDeclaration(node: ts.Declaration): node is TypeDeclaration {
  return (
    ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)
  );
}

/** Collects the project type `symbol` names, if it is one, into `found`. */
function consider(analysis: Analysis, symbol: ts.Symbol | undefined, found: Set<string>): void {
  if (!symbol) return;
  const target = resolveAlias(analysis.checker, symbol);
  const declaration = target.declarations?.find(isTypeDeclaration);
  if (declaration && !isExternal(analysis, declaration.getSourceFile())) {
    found.add(collect(analysis, target, declaration));
  }
}

function typeId(store: TypeStore, declaration: TypeDeclaration): string {
  const file = declaration.getSourceFile();
  return `${declaration.name.text} (${path.relative(store.root, file.fileName).split(path.sep).join("/")})`;
}

/**
 * The id the project interface or alias `declaration` has, or `undefined` for a
 * library's. It is not registered: a type that declares props is only worth
 * listing when several components share it, which `finishTypes` decides.
 */
export function declaredTypeId(
  analysis: Analysis,
  declaration: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
): string | undefined {
  const symbol = analysis.checker.getSymbolAtLocation(declaration.name);
  if (!symbol || isExternal(analysis, declaration.getSourceFile())) return undefined;
  const id = typeId(analysis.types, declaration);
  analysis.types.declarers.set(id, { symbol, declaration });
  return id;
}

/** Every type reference under `node`. Library types are skipped, but their type arguments are not: `Record<Key, Item>`. */
function referencesIn(analysis: Analysis, node: ts.Node, found: Set<string>): void {
  const visit = (current: ts.Node) => {
    // `typeof value` names a value, not a declared type.
    if (ts.isTypeQueryNode(current)) return;
    const name = ts.isTypeReferenceNode(current)
      ? current.typeName
      : ts.isExpressionWithTypeArguments(current)
        ? current.expression
        : undefined;
    if (name) consider(analysis, analysis.checker.getSymbolAtLocation(name), found);
    ts.forEachChild(current, visit);
  };
  visit(node);
}

/** For a type nobody wrote down: whatever its aliases, type arguments and signatures name. */
function referencesOfType(
  analysis: Analysis,
  type: ts.Type,
  found: Set<string>,
  seen = new Set<ts.Type>(),
): void {
  if (seen.has(type)) return;
  seen.add(type);
  const { checker } = analysis;
  const next = (other: ts.Type) => referencesOfType(analysis, other, found, seen);

  consider(analysis, type.aliasSymbol, found);
  type.aliasTypeArguments?.forEach(next);
  consider(analysis, type.symbol, found);
  if (type.isUnionOrIntersection()) type.types.forEach(next);
  if (
    type.flags & ts.TypeFlags.Object &&
    (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
  ) {
    checker.getTypeArguments(type as ts.TypeReference).forEach(next);
  }
  for (const signature of type.getCallSignatures()) {
    for (const parameter of signature.getParameters()) next(checker.getTypeOfSymbol(parameter));
    next(signature.getReturnType());
  }
}

/** Ids of the project types a property's type mentions, in no particular order. */
export function referencesOfProperty(
  analysis: Analysis,
  property: ts.Symbol,
  type: ts.Type,
): string[] {
  const node = declaredTypeNode(property);
  const found = new Set<string>();
  if (node) referencesIn(analysis, node, found);
  else referencesOfType(analysis, type, found);
  return [...found];
}

function typeParametersOf(declaration: TypeDeclaration): TypeParameterInfo[] | undefined {
  if (ts.isEnumDeclaration(declaration) || !declaration.typeParameters) return undefined;
  const text = (node: ts.Node) =>
    oneLine(printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()));
  return declaration.typeParameters.map((parameter) => ({
    name: parameter.name.text,
    ...(parameter.constraint ? { constraint: text(parameter.constraint) } : {}),
    ...(parameter.default ? { default: text(parameter.default) } : {}),
  }));
}

/** An alias is described by its members when it is an object type: `type Item = { … }`, `Omit<Base, "x">`. */
function isObjectType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return (
    (type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) !== 0 &&
    !checker.isArrayType(type) &&
    !checker.isTupleType(type) &&
    type.getCallSignatures().length === 0
  );
}

function collect(analysis: Analysis, symbol: ts.Symbol, declaration: TypeDeclaration): string {
  const { checker, types: store } = analysis;
  const known = store.ids.get(symbol);
  if (known) return known;

  const file = declaration.getSourceFile();
  const name = declaration.name.text;
  const sourceFilePath = path.relative(store.root, file.fileName).split(path.sep).join("/");
  const id = typeId(store, declaration);
  // Before looking inside: a type may mention itself.
  store.ids.set(symbol, id);

  const definition = printer
    .printNode(ts.EmitHint.Unspecified, declaration, file)
    .replace(/^(?:export\s+)?(?:default\s+)?(?:declare\s+)?/, "");
  const declared = checker.getDeclaredTypeOfSymbol(symbol);

  const described =
    !ts.isEnumDeclaration(declaration) && isObjectType(checker, declared)
      ? describeMembers(analysis, new Set([declared]), declaration, new Map())
      : undefined;

  let values: (string | number | boolean)[] | undefined;
  if (ts.isEnumDeclaration(declaration)) {
    const constants = declaration.members.map((member) => checker.getConstantValue(member));
    if (constants.length > 0 && constants.every((value) => value !== undefined)) {
      values = constants as (string | number)[];
    }
  } else if (ts.isTypeAliasDeclaration(declaration)) {
    const literals = literalValues(checker, declared);
    values = literals && inSourceOrder(literals, definition);
  }

  const references = new Set<string>();
  referencesIn(analysis, declaration, references);

  const { storiesFiles: _stories, ...doc } = jsDoc(analysis, symbol);
  const typeParameters = typeParametersOf(declaration);
  store.types.push({
    id,
    name,
    kind: ts.isInterfaceDeclaration(declaration)
      ? "interface"
      : ts.isEnumDeclaration(declaration)
        ? "enum"
        : "type",
    ...(typeParameters ? { typeParameters } : {}),
    sourceFilePath,
    line: file.getLineAndCharacterOfPosition(declaration.getStart(file)).line + 1,
    ...doc,
    definition,
    ...(described ? { members: described.props } : {}),
    ...(described?.inherits.length ? { inherits: described.inherits } : {}),
    ...(values ? { values } : {}),
    references: [...references],
  });
  return id;
}

const byText = (a: string, b: string) => a.localeCompare(b);

/**
 * Gives the types their final ids, the bare name unless two types share it,
 * and rewrites every reference to match. Done once everything is collected
 * so that ids do not depend on the order components were visited in.
 */
export function finishTypes(analysis: Analysis, components: ComponentInfo[]): TypeInfo[] {
  const { types, declarers } = analysis.types;

  // A type that declares props of several components is listed, to say once what each of them accepts.
  const sharers = new Map<string, number>();
  for (const component of components) {
    for (const id of new Set(component.props.map((prop) => prop.declaredIn))) {
      if (id) sharers.set(id, (sharers.get(id) ?? 0) + 1);
    }
  }
  for (const [id, count] of sharers) {
    const declarer = declarers.get(id);
    if (count >= 2 && declarer) collect(analysis, declarer.symbol, declarer.declaration);
  }
  const listed = new Set(types.map((type) => type.id));
  const dropUnlisted = (props: { declaredIn?: string }[]) => {
    for (const prop of props)
      if (prop.declaredIn && !listed.has(prop.declaredIn)) delete prop.declaredIn;
  };
  for (const type of types) dropUnlisted(type.members ?? []);
  for (const component of components) dropUnlisted(component.props);

  const names = new Map<string, number>();
  for (const type of types) names.set(type.name, (names.get(type.name) ?? 0) + 1);
  const ids = new Map(
    types.map((type) => [type.id, names.get(type.name) === 1 ? type.name : type.id]),
  );
  const remap = (list: string[]) => [...new Set(list.map((id) => ids.get(id)!))].sort(byText);

  const remapProps = (props: { references?: string[]; declaredIn?: string }[]) => {
    for (const prop of props) {
      if (prop.references) prop.references = remap(prop.references);
      if (prop.declaredIn) prop.declaredIn = ids.get(prop.declaredIn)!;
    }
  };
  for (const type of types) {
    type.references = remap(type.references);
    remapProps(type.members ?? []);
    type.id = ids.get(type.id)!;
  }
  for (const component of components) {
    component.references = remap(component.references);
    remapProps(component.props);
  }
  return types.sort((a, b) => byText(a.id, b.id));
}

/** The types with these ids and everything they reference, transitively, each once, the given ones first. */
export function typeClosure(ids: string[], types: TypeInfo[]): TypeInfo[] {
  const byId = new Map(types.map((type) => [type.id, type]));
  const closure: TypeInfo[] = [];
  const seen = new Set<string>();
  const queue = [...ids];
  for (let index = 0; index < queue.length; index++) {
    const type = byId.get(queue[index]!);
    if (!type || seen.has(type.id)) continue;
    seen.add(type.id);
    closure.push(type);
    queue.push(...type.references);
  }
  return closure;
}
