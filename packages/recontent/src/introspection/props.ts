import path from "node:path";
import type { ComponentInfo, InheritedProps, PropInfo, TypeParameterInfo } from "./model.js";
import ts from "typescript";
import { categoryOf, jsDoc } from "./jsdoc.js";
import { resolveAlias, type Analysis, type Candidate } from "./components.js";
import { declaredTypeId, referencesOfProperty } from "./types.js";

type Origin = InheritedProps & { symbol?: ts.Symbol };

export const printer = ts.createPrinter({ removeComments: true });

export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

const packages = new Map<string, string | undefined>();

function packageOf(fileName: string): string | undefined {
  if (packages.has(fileName)) return packages.get(fileName);
  const found = lookupPackage(fileName);
  packages.set(fileName, found);
  return found;
}

function lookupPackage(fileName: string): string | undefined {
  const normalized = fileName.split(path.sep).join("/");
  const index = normalized.lastIndexOf("/node_modules/");
  if (index === -1) return undefined;
  const [first, second] = normalized.slice(index + "/node_modules/".length).split("/");
  return first?.startsWith("@") && second ? `${first}/${second}` : first;
}

export function isExternal(analysis: Analysis, file: ts.SourceFile): boolean {
  const { program } = analysis;
  return (
    program.isSourceFileFromExternalLibrary(file) ||
    program.isSourceFileDefaultLibrary(file) ||
    packageOf(file.fileName) !== undefined
  );
}

function declarationOf(symbol: ts.Symbol): ts.Declaration | undefined {
  return symbol.valueDeclaration ?? symbol.declarations?.[0];
}

/** Follows `{ Item }`, `{ Item: Impl }`, and `Tabs.Item = Impl` to the declaration of the component itself. */
function locate(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Declaration | undefined {
  let current = symbol;
  for (let depth = 0; depth < 3; depth++) {
    const declaration = declarationOf(current);
    let next: ts.Symbol | undefined;
    if (declaration && ts.isShorthandPropertyAssignment(declaration)) {
      next = checker.getShorthandAssignmentValueSymbol(declaration);
    } else if (
      declaration &&
      ts.isPropertyAssignment(declaration) &&
      ts.isIdentifier(declaration.initializer)
    ) {
      next = checker.getSymbolAtLocation(declaration.initializer);
    } else if (
      declaration &&
      ts.isPropertyAccessExpression(declaration) &&
      ts.isBinaryExpression(declaration.parent) &&
      declaration.parent.left === declaration &&
      declaration.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(declaration.parent.right)
    ) {
      next = checker.getSymbolAtLocation(declaration.parent.right);
    }
    if (!next) return declaration;
    current = resolveAlias(checker, next);
  }
  return declarationOf(current);
}

/** Strips only `undefined` from a type (preserving `| null`). */
function stripUndefined(checker: ts.TypeChecker, type: ts.Type): ts.Type {
  if (!type.isUnion()) return type;
  const withoutUndefined = type.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
  if (withoutUndefined.length === type.types.length) return type;
  if (withoutUndefined.length === 1) return withoutUndefined[0]!;
  return type;
}

/** True when `node` references a type parameter that has been instantiated away in `instantiated`. */
export function hasInstantiatedTypeParam(
  checker: ts.TypeChecker,
  node: ts.TypeNode,
  instantiated: ts.Type,
): boolean {
  let hasTypeParamRef = false;
  const visit = (n: ts.Node): void => {
    if (hasTypeParamRef) return;
    if (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName)) {
      const sym = checker.getSymbolAtLocation(n.typeName);
      if (sym && (sym.flags & ts.SymbolFlags.TypeParameter) !== 0) {
        hasTypeParamRef = true;
        return;
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  if (!hasTypeParamRef) return false;
  // If the instantiated type still mentions the same type parameter, it wasn't instantiated (e.g. generic component).
  const containsTypeParam = (t: ts.Type, seen = new Set<ts.Type>()): boolean => {
    if (seen.has(t)) return false;
    seen.add(t);
    if (t.flags & ts.TypeFlags.TypeParameter) return true;
    if (t.isUnionOrIntersection()) return t.types.some((m) => containsTypeParam(m, seen));
    if (
      t.flags & ts.TypeFlags.Object &&
      (t as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
    ) {
      return checker
        .getTypeArguments(t as ts.TypeReference)
        .some((a) => containsTypeParam(a, seen));
    }
    for (const sig of t.getCallSignatures()) {
      if (sig.getParameters().some((p) => containsTypeParam(checker.getTypeOfSymbol(p), seen))) {
        return true;
      }
      if (containsTypeParam(sig.getReturnType(), seen)) return true;
    }
    return false;
  };
  return !containsTypeParam(instantiated);
}

/** The type as written on the property, not a method's return type. */
export function declaredTypeNode(symbol: ts.Symbol): ts.TypeNode | undefined {
  const declaration = declarationOf(symbol);
  return declaration &&
    (ts.isPropertySignature(declaration) ||
      ts.isPropertyDeclaration(declaration) ||
      ts.isParameter(declaration))
    ? declaration.type
    : undefined;
}

function typeText(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  propType: ts.Type,
  optional: boolean,
  location: ts.Node,
): string {
  const declaration = declarationOf(symbol);
  const node = declaredTypeNode(symbol);
  if (node && !hasInstantiatedTypeParam(checker, node, propType)) {
    return oneLine(printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()));
  }
  const text = checker.typeToString(
    optional ? stripUndefined(checker, propType) : propType,
    declaration ?? location,
    ts.TypeFormatFlags.NoTruncation,
  );
  return optional ? text.replace(/ \| undefined$/, "") : text;
}

function containsIndexedAccess(node: ts.Node): boolean {
  return ts.isIndexedAccessTypeNode(node) || !!ts.forEachChild(node, containsIndexedAccess);
}

/**
 * The prop's type with the project's own alias expanded, e.g. `Width` →
 * `number | "100%" | "auto"`, or `undefined` when there is no such alias.
 * Library aliases stay as written: `MouseEventHandler<…>` reads better than
 * what it expands to. An indexed access (`Sprinkles["gap"]`) is resolved too,
 * since it names nothing the reader can look up: to the alias the checker
 * kept (`ReactNode`), else to what it is.
 */
function resolvedText(
  analysis: Analysis,
  symbol: ts.Symbol,
  type: ts.Type,
  declared: string,
): string | undefined {
  const { checker } = analysis;
  const nonNull = checker.getNonNullableType(type);
  const hasNull =
    (type.flags & ts.TypeFlags.Null) !== 0 ||
    (type.isUnion() && type.types.some((t) => (t.flags & ts.TypeFlags.Null) !== 0));
  const aliasDeclaration = nonNull.aliasSymbol?.declarations?.[0];
  const projectAlias =
    !!aliasDeclaration && !isExternal(analysis, aliasDeclaration.getSourceFile());
  const node = declaredTypeNode(symbol);
  if (!projectAlias && !(node && containsIndexedAccess(node))) return undefined;
  let text = checker
    .typeToString(
      projectAlias || !type.aliasSymbol ? nonNull : type,
      declarationOf(symbol),
      projectAlias
        ? ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias
        : ts.TypeFormatFlags.NoTruncation,
    )
    .replace(/ \| undefined$/, "");
  if (hasNull && !/\bnull\b/.test(text)) {
    text = `${text} | null`;
  }
  return text === declared ? undefined : text;
}

function typeParametersOf(
  checker: ts.TypeChecker,
  signature: ts.Signature,
  location: ts.Node,
): TypeParameterInfo[] | undefined {
  const parameters = signature.getTypeParameters();
  if (!parameters?.length) return undefined;
  const render = (type: ts.Type) =>
    checker.typeToString(type, location, ts.TypeFormatFlags.NoTruncation);
  return parameters.map((parameter) => {
    const constraint = parameter.getConstraint();
    const fallback = parameter.getDefault();
    return {
      name: parameter.symbol.name,
      ...(constraint ? { constraint: render(constraint) } : {}),
      ...(fallback ? { default: render(fallback) } : {}),
    };
  });
}

export function literalValues(
  checker: ts.TypeChecker,
  type: ts.Type,
): (string | number | boolean)[] | undefined {
  const nonNull = checker.getNonNullableType(type);
  const values: (string | number | boolean)[] = [];
  for (const member of nonNull.isUnion() ? nonNull.types : [nonNull]) {
    if (member.isStringLiteral() || member.isNumberLiteral()) {
      values.push(member.value);
    } else if (member.flags & ts.TypeFlags.BooleanLiteral) {
      values.push(member === checker.getTrueType());
    } else {
      return undefined;
    }
  }
  // A plain `boolean` is `true | false`, which says nothing more than its name.
  if (values.length === 2 && values.every((value) => typeof value === "boolean")) return undefined;
  return values.length > 0 ? values : undefined;
}

/** Union members come back in type-id order; prefer the order they were written in. */
export function inSourceOrder(values: (string | number | boolean)[], text: string) {
  const position = (value: string | number | boolean) => {
    if (typeof value === "string") {
      const forms = [`"${value}"`, `'${value}'`];
      const found = forms.map((form) => text.indexOf(form)).filter((index) => index !== -1);
      return found.length > 0 ? Math.min(...found) : Infinity;
    }
    const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`(?<![\\w.-])${escaped}(?![\\w.])`).exec(text);
    return match ? match.index : Infinity;
  };
  return values
    .map((value, index) => ({ value, index, at: position(value) }))
    .sort((a, b) => a.at - b.at || a.index - b.index)
    .map(({ value }) => value);
}

function aliasText(type: ts.Type): string {
  const declaration = type.aliasSymbol?.declarations?.[0];
  return declaration && ts.isTypeAliasDeclaration(declaration) ? declaration.type.getText() : "";
}

/** Destructuring defaults of the implementation behind the export, as written. */
function implementationDefaults(
  checker: ts.TypeChecker,
  declaration: ts.Node | undefined,
): Map<string, string> {
  const defaults = new Map<string, string>();

  const findFunction = (
    node: ts.Node | undefined,
    depth = 0,
  ): ts.SignatureDeclaration | undefined => {
    if (!node || depth > 5) return undefined;
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      return node;
    }
    if (ts.isVariableDeclaration(node)) return findFunction(node.initializer, depth + 1);
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isBinaryExpression(node.parent) &&
      node.parent.left === node &&
      node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      return findFunction(node.parent.right, depth + 1);
    }
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      return findFunction(node.expression, depth + 1);
    }
    // memo(X), forwardRef(fn), Object.assign(Root, { … }), withTheme(X): the wrapped component comes first.
    if (ts.isCallExpression(node)) return findFunction(node.arguments[0], depth + 1);
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node);
      const target = symbol && resolveAlias(checker, symbol);
      return findFunction(target && declarationOf(target), depth + 1);
    }
    return undefined;
  };

  const first = findFunction(declaration)?.parameters[0]?.name;
  if (first && ts.isObjectBindingPattern(first)) {
    for (const element of first.elements) {
      if (!element.initializer || element.dotDotDotToken) continue;
      const key = element.propertyName ?? element.name;
      if (ts.isIdentifier(key) || ts.isStringLiteral(key)) {
        defaults.set(key.text, oneLine(element.initializer.getText()));
      }
    }
  }
  return defaults;
}

/** `static defaultProps = { … }` on classes. */
function defaultPropsDefaults(checker: ts.TypeChecker, type: ts.Type): Map<string, string> {
  const defaults = new Map<string, string>();
  const declaration = checker.getPropertyOfType(type, "defaultProps")?.valueDeclaration;
  const initializer =
    declaration && ts.isPropertyDeclaration(declaration) ? declaration.initializer : undefined;
  if (initializer && ts.isObjectLiteralExpression(initializer)) {
    for (const property of initializer.properties) {
      if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        defaults.set(property.name.text, property.initializer.getText());
      } else if (ts.isShorthandPropertyAssignment(property)) {
        defaults.set(property.name.text, property.name.text);
      }
    }
  }
  return defaults;
}

/** The project interface or alias a property is declared in; none for inline literals, mapped types and classes. */
function declaringType(
  analysis: Analysis,
  declaration: ts.Declaration | undefined,
): string | undefined {
  for (let current = declaration?.parent; current; current = current.parent) {
    if (ts.isInterfaceDeclaration(current) || ts.isTypeAliasDeclaration(current)) {
      return declaredTypeId(analysis, current);
    }
    // A parameter's literal type or a class belongs to no named type.
    if (!ts.isTypeNode(current) && !ts.isTypeElement(current)) return undefined;
  }
  return undefined;
}

function enclosingTypeDeclaration(node: ts.Node): ts.Declaration | undefined {
  for (let current = node.parent; current; current = current.parent) {
    if (
      ts.isInterfaceDeclaration(current) ||
      ts.isClassLike(current) ||
      ts.isTypeAliasDeclaration(current)
    ) {
      return current;
    }
  }
  return undefined;
}

function ancestorsOf(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
  cache?: Map<ts.Symbol, Set<ts.Symbol>>,
  seen = new Set<ts.Symbol>(),
): Set<ts.Symbol> {
  if (seen.size === 0 && cache?.has(symbol)) {
    return cache.get(symbol)!;
  }
  const declared = checker.getDeclaredTypeOfSymbol(symbol);
  if (declared.isClassOrInterface()) {
    for (const base of checker.getBaseTypes(declared)) {
      if (base.symbol && !seen.has(base.symbol)) {
        seen.add(base.symbol);
        ancestorsOf(checker, base.symbol, undefined, seen);
      }
    }
  }
  if (cache) cache.set(symbol, seen);
  return seen;
}

/**
 * Groups props declared outside the project by where they come from, folding
 * an interface's bases into the most derived one present: `onClick` is
 * declared on `DOMAttributes` but reported under `ButtonHTMLAttributes`.
 */
function groupInherited(analysis: Analysis, symbols: ts.Symbol[]): InheritedProps[] {
  const { checker } = analysis;
  const origins = new Map<string, Origin>();

  for (const symbol of symbols) {
    const declaration = declarationOf(symbol);
    if (!declaration) continue;
    const file = declaration.getSourceFile();
    const owner = enclosingTypeDeclaration(declaration);
    const ownerName =
      owner && "name" in owner ? (owner.name as ts.Identifier | undefined) : undefined;
    const name =
      ownerName?.text ?? path.basename(file.fileName).replace(/\.d\.[cm]?ts$|\.[cm]?tsx?$/, "");
    const pkg = packageOf(file.fileName);
    const key = `${pkg ?? ""}\0${name}`;
    const origin = origins.get(key);
    if (origin) {
      origin.props.push(symbol.name);
    } else {
      origins.set(key, {
        name,
        ...(pkg ? { package: pkg } : {}),
        props: [symbol.name],
        symbol: ownerName && checker.getSymbolAtLocation(ownerName),
      });
    }
  }

  const all = [...origins.values()];
  const ancestors = new Map(
    all.map((origin) => [
      origin,
      origin.symbol ? ancestorsOf(checker, origin.symbol, analysis.ancestorsCache) : new Set(),
    ]),
  );
  const baseOrigins = new Set<Origin>();
  for (const origin of all) {
    if (
      origin.symbol &&
      all.some((other) => other !== origin && ancestors.get(other)!.has(origin.symbol!))
    ) {
      baseOrigins.add(origin);
    }
  }

  const roots = all.filter((origin) => !baseOrigins.has(origin));
  for (const origin of baseOrigins) {
    const root = roots.find((candidate) => ancestors.get(candidate)!.has(origin.symbol!));
    if (root) root.props.push(...origin.props);
    else roots.push(origin);
  }

  return roots
    .map(({ name, package: pkg, props }) => ({
      name,
      ...(pkg ? { package: pkg } : {}),
      props: props.sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type Occurrence = { symbol: ts.Symbol; type: ts.Type };

/** Library wrappers that keep the keys of their first argument as they are, or narrow them. */
const TRANSPARENT = new Set([
  "Partial",
  "Required",
  "Readonly",
  "PropsWithoutRef",
  "PropsWithChildren",
  "PropsWithRef",
  "Omit",
]);

/**
 * The keys that project code picks from library types with `Pick<Lib, "a" | "b">`.
 * Naming them is a deliberate choice, so they are the project's own props even
 * though the declarations stay in the library. `Omit` is not: it keeps whatever
 * the project never named. Only the project's own declarations are walked, and
 * the library types whose keys are not picked are not entered.
 */
function pickedKeys(analysis: Analysis, propsTypes: Iterable<ts.Type>): Set<string> {
  const { checker } = analysis;
  const keys = new Set<string>();
  const seen = new Set<unknown>();

  const isLibrary = (symbol: ts.Symbol) =>
    !symbol.declarations?.length ||
    symbol.declarations.every((declaration) => isExternal(analysis, declaration.getSourceFile()));

  const addKeys = (type: ts.Type) => {
    for (const value of literalValues(checker, type) ?? []) {
      if (typeof value === "string") keys.add(value);
    }
  };

  /** The heritage clauses of a project interface or class, and the type of a project alias. */
  const fromDeclarations = (symbol: ts.Symbol) => {
    for (const declaration of symbol.declarations ?? []) {
      if (ts.isTypeAliasDeclaration(declaration)) {
        fromNode(declaration.type);
      } else if (ts.isInterfaceDeclaration(declaration) || ts.isClassLike(declaration)) {
        for (const clause of declaration.heritageClauses ?? []) clause.types.forEach(fromNode);
      }
    }
  };

  function fromNode(node: ts.Node): void {
    if (ts.isParenthesizedTypeNode(node)) return fromNode(node.type);
    if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
      return node.types.forEach(fromNode);
    }
    if (!ts.isTypeReferenceNode(node) && !ts.isExpressionWithTypeArguments(node)) return;
    const name = ts.isTypeReferenceNode(node) ? node.typeName : node.expression;
    const found = checker.getSymbolAtLocation(name);
    if (!found) return;
    const symbol = resolveAlias(checker, found);
    if (isLibrary(symbol)) {
      const args = node.typeArguments ?? [];
      if (symbol.name === "Pick" && args[1]) addKeys(checker.getTypeFromTypeNode(args[1]));
      else if (TRANSPARENT.has(symbol.name) && args[0]) fromNode(args[0]);
    } else if (!seen.has(symbol)) {
      seen.add(symbol);
      fromDeclarations(symbol);
    }
  }

  function fromType(type: ts.Type): void {
    if (seen.has(type)) return;
    seen.add(type);
    const alias = type.aliasSymbol;
    if (alias) {
      if (isLibrary(alias)) {
        const args = type.aliasTypeArguments ?? [];
        if (alias.name === "Pick" && args[1]) addKeys(args[1]);
        else if (TRANSPARENT.has(alias.name) && args[0]) fromType(args[0]);
      } else {
        // The alias hides what it is made of, so read it as written.
        fromDeclarations(alias);
      }
    } else if (type.isUnionOrIntersection()) {
      type.types.forEach(fromType);
    } else if (type.symbol && !isLibrary(type.symbol)) {
      fromDeclarations(type.symbol);
    }
  }

  for (const type of propsTypes) fromType(type);
  return keys;
}

/**
 * Describes the properties of `propsTypes` (a union is merged member by member,
 * because the checker only reports the properties every member shares): the
 * ones declared in the project in full, the others grouped by where they come from.
 */
export function describeMembers(
  analysis: Analysis,
  propsTypes: Set<ts.Type>,
  location: ts.Node,
  defaults: Map<string, string>,
  component?: string,
): { props: PropInfo[]; inherits: InheritedProps[] } {
  const { checker } = analysis;
  const byName = new Map<string, { symbol: ts.Symbol }[]>();
  for (const member of propsTypes) {
    for (const property of checker.getPropertiesOfType(member)) {
      const list = byName.get(property.name) ?? [];
      list.push({ symbol: property });
      byName.set(property.name, list);
    }
  }

  const props: PropInfo[] = [];
  const inherited: ts.Symbol[] = [];
  let picked: Set<string> | undefined;
  for (const [name, occurrences] of byName) {
    const describe = (list: { symbol: ts.Symbol }[]): Occurrence[] =>
      list.map(({ symbol }) => ({
        symbol,
        type: checker.getTypeOfSymbolAtLocation(symbol, location),
      }));
    let own = describe(
      occurrences.filter(({ symbol: property }) => {
        const propertyDeclaration = declarationOf(property);
        return !propertyDeclaration || !isExternal(analysis, propertyDeclaration.getSourceFile());
      }),
    );
    // Declared by a library, but named by the project in a `Pick`: its own prop.
    if (own.length === 0 && (picked ??= pickedKeys(analysis, propsTypes)).has(name)) {
      own = describe(occurrences);
    }
    if (own.length === 0) {
      inherited.push(occurrences[0]!.symbol);
      continue;
    }

    const rendered = own.map(({ symbol: property, type: propType }) => {
      const declared = typeText(
        checker,
        property,
        propType,
        !!(property.flags & ts.SymbolFlags.Optional),
        location,
      );
      return { declared, resolved: resolvedText(analysis, property, propType, declared) };
    });
    const unique = (texts: string[]) => [...new Set(texts)].join(" | ");
    const text = unique(rendered.map(({ declared }) => declared));
    const resolved = rendered.some((entry) => entry.resolved !== undefined)
      ? unique(rendered.map((entry) => entry.resolved ?? entry.declared))
      : undefined;
    const literals = own.map(({ type: propType }) => literalValues(checker, propType));
    const values = literals.every((list) => list !== undefined)
      ? inSourceOrder(
          [...new Set(literals.flat() as (string | number | boolean)[])],
          `${text} ${own.map(({ type: propType }) => aliasText(propType)).join(" ")}`,
        )
      : undefined;
    const references = [
      ...new Set(
        own.flatMap(({ symbol: property, type: propType }) =>
          referencesOfProperty(analysis, property, propType),
        ),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const owners = new Set(own.map(({ symbol }) => declaringType(analysis, declarationOf(symbol))));
    const [declaredIn] = owners.size === 1 ? owners : [];

    const { storiesFiles: _stories, ...doc } = jsDoc(analysis, own[0]!.symbol, component);
    const defaultValue = doc.defaultValue ?? defaults.get(name);
    props.push({
      name,
      type: text,
      // Literal unions already say it all in `values`.
      ...(resolved && !values ? { resolved } : {}),
      ...(values ? { values } : {}),
      ...(references.length > 0 ? { references } : {}),
      ...(declaredIn ? { declaredIn } : {}),
      // Required only when every member of a props union has it, and requires it.
      required:
        occurrences.length === propsTypes.size &&
        occurrences.every(({ symbol: property }) => !(property.flags & ts.SymbolFlags.Optional)),
      ...doc,
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    });
  }
  props.sort((a, b) => a.name.localeCompare(b.name));
  return { props, inherits: groupInherited(analysis, inherited) };
}

export function describeComponent(
  analysis: Analysis,
  candidate: Candidate,
  root: string,
): ComponentInfo {
  const { checker } = analysis;
  const { symbol, type, matches } = candidate;
  const declaration = locate(checker, symbol);
  const located = declaration ?? declarationOf(symbol);
  if (!located) throw new Error(`Cannot find the declaration of ${candidate.name}.`);

  const propsTypes = new Set<ts.Type>();
  for (const { signature } of matches) {
    const parameter = signature.parameters[0];
    if (!parameter) continue;
    const propsType = checker.getNonNullableType(
      checker.getTypeOfSymbolAtLocation(parameter, located),
    );
    for (const member of propsType.isUnion() ? propsType.types : [propsType]) {
      propsTypes.add(member);
    }
  }

  const defaults = new Map([
    ...defaultPropsDefaults(checker, type),
    ...implementationDefaults(checker, located),
  ]);
  const { props, inherits } = describeMembers(
    analysis,
    propsTypes,
    located,
    defaults,
    candidate.name,
  );

  const locatedSymbol = (() => {
    const name = "name" in located ? (located.name as ts.Node | undefined) : undefined;
    if (name && typeof name === "object" && typeof name.kind === "number") {
      const sym = checker.getSymbolAtLocation(name);
      return sym ? resolveAlias(checker, sym) : undefined;
    }
    return undefined;
  })();
  const fallbackSymbol = locatedSymbol && locatedSymbol !== symbol ? locatedSymbol : undefined;
  const category =
    categoryOf(checker, symbol) ??
    (fallbackSymbol ? categoryOf(checker, fallbackSymbol) : undefined);
  const primaryDoc = jsDoc(analysis, symbol, candidate.name);
  const fallbackDoc = fallbackSymbol ? jsDoc(analysis, fallbackSymbol, candidate.name) : undefined;
  const mergedDoc = fallbackDoc ? { ...fallbackDoc, ...primaryDoc } : primaryDoc;
  const { storiesFiles = [], ...doc } = mergedDoc;
  const stories = storiesFiles.map((file) => path.relative(root, file).split(path.sep).join("/"));
  const file = located.getSourceFile();
  const typeParameters = matches
    .map(({ signature }) => typeParametersOf(checker, signature, located))
    .find((parameters) => parameters !== undefined);
  const info: ComponentInfo = {
    name: candidate.name,
    ...(typeParameters ? { typeParameters } : {}),
    sourceFilePath: path.relative(root, file.fileName).split(path.sep).join("/"),
    line: file.getLineAndCharacterOfPosition(located.getStart(file)).line + 1,
    ...(category ? { category } : {}),
    ...(stories.length > 0 ? { stories } : {}),
    ...doc,
    props,
    inherits,
    references: [...new Set(props.flatMap((prop) => prop.references ?? []))].sort((a, b) =>
      a.localeCompare(b),
    ),
  };
  return info;
}
