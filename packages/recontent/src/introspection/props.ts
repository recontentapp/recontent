import path from "node:path";
import type {
  ComponentInfo,
  InheritedProps,
  PropInfo,
  TypeParameterInfo,
} from "@recontentapp/core";
import ts from "typescript";
import { componentSignatures, resolveAlias, type Analysis, type Candidate } from "./components.js";

type Origin = InheritedProps & { symbol?: ts.Symbol };

const printer = ts.createPrinter({ removeComments: true });

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function packageOf(fileName: string): string | undefined {
  const normalized = fileName.split(path.sep).join("/");
  const index = normalized.lastIndexOf("/node_modules/");
  if (index === -1) return undefined;
  const [first, second] = normalized.slice(index + "/node_modules/".length).split("/");
  return first?.startsWith("@") && second ? `${first}/${second}` : first;
}

function isExternal(analysis: Analysis, file: ts.SourceFile): boolean {
  const { program } = analysis;
  return (
    program.isSourceFileFromExternalLibrary(file) ||
    program.isSourceFileDefaultLibrary(file) ||
    packageOf(file.fileName) !== undefined
  );
}

function jsDoc(
  checker: ts.TypeChecker,
  symbol: ts.Symbol,
): Pick<PropInfo, "description" | "deprecated" | "defaultValue"> {
  const description = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  const tags = symbol.getJsDocTags(checker);
  const text = (name: string) => {
    const tag = tags.find((candidate) => candidate.name === name);
    return tag && ts.displayPartsToString(tag.text).trim();
  };
  const deprecated = text("deprecated");
  const defaultValue = text("default") || text("defaultValue");
  return {
    ...(description ? { description } : {}),
    ...(deprecated !== undefined ? { deprecated: deprecated || true } : {}),
    ...(defaultValue ? { defaultValue } : {}),
  };
}

function declarationOf(symbol: ts.Symbol): ts.Declaration | undefined {
  return symbol.valueDeclaration ?? symbol.declarations?.[0];
}

/** Follows `{ Item }` and `{ Item: Impl }` to the declaration of the component itself. */
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
    }
    if (!next) return declaration;
    current = resolveAlias(checker, next);
  }
  return declarationOf(current);
}

function typeText(checker: ts.TypeChecker, symbol: ts.Symbol, optional: boolean): string {
  const declaration = declarationOf(symbol);
  // Only declarations whose `type` is the property's own type (not a method's return type).
  const node =
    declaration &&
    (ts.isPropertySignature(declaration) ||
      ts.isPropertyDeclaration(declaration) ||
      ts.isParameter(declaration))
      ? declaration.type
      : undefined;
  if (node) {
    return oneLine(printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile()));
  }
  const text = checker.typeToString(
    checker.getTypeOfSymbolAtLocation(symbol, declaration ?? symbol.valueDeclaration!),
    declaration,
    ts.TypeFormatFlags.NoTruncation,
  );
  return optional ? text.replace(/ \| undefined$/, "") : text;
}

/**
 * The prop's type with the project's own alias expanded, e.g. `Width` →
 * `number | "100%" | "auto"`, or `undefined` when there is no such alias.
 * Library aliases stay as written: `MouseEventHandler<…>` reads better than
 * what it expands to.
 */
function resolvedText(
  analysis: Analysis,
  symbol: ts.Symbol,
  type: ts.Type,
  declared: string,
): string | undefined {
  const { checker } = analysis;
  const nonNull = checker.getNonNullableType(type);
  const aliasDeclaration = nonNull.aliasSymbol?.declarations?.[0];
  if (!aliasDeclaration || isExternal(analysis, aliasDeclaration.getSourceFile())) return undefined;
  const text = checker
    .typeToString(
      nonNull,
      declarationOf(symbol),
      ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
    )
    .replace(/ \| undefined$/, "");
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

function literalValues(
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
function inSourceOrder(values: (string | number | boolean)[], text: string) {
  const position = (value: string | number | boolean) => {
    const forms = typeof value === "string" ? [`"${value}"`, `'${value}'`] : [String(value)];
    const found = forms.map((form) => text.indexOf(form)).filter((index) => index !== -1);
    return found.length > 0 ? Math.min(...found) : Infinity;
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
        defaults.set(key.text, element.initializer.getText());
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

function ancestorsOf(checker: ts.TypeChecker, symbol: ts.Symbol, seen = new Set<ts.Symbol>()) {
  const declared = checker.getDeclaredTypeOfSymbol(symbol);
  if (declared.isClassOrInterface()) {
    for (const base of checker.getBaseTypes(declared)) {
      if (base.symbol && !seen.has(base.symbol)) {
        seen.add(base.symbol);
        ancestorsOf(checker, base.symbol, seen);
      }
    }
  }
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
    all.map((origin) => [origin, origin.symbol ? ancestorsOf(checker, origin.symbol) : new Set()]),
  );
  const isBaseOfAnother = (origin: Origin) =>
    !!origin.symbol &&
    all.some((other) => other !== origin && ancestors.get(other)!.has(origin.symbol!));

  const roots = all.filter((origin) => !isBaseOfAnother(origin));
  for (const origin of all) {
    if (!isBaseOfAnother(origin)) continue;
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

export function describeComponent(
  analysis: Analysis,
  candidate: Candidate,
  root: string,
): ComponentInfo {
  const { checker } = analysis;
  const { symbol, type } = candidate;
  const declaration = locate(checker, symbol);
  const located = declaration ?? declarationOf(symbol);
  if (!located) throw new Error(`Cannot find the declaration of ${candidate.name}.`);

  // Props are the first parameter of whatever signature renders the component. A
  // union of props (`{ href } | { onClick }`) is merged member by member, because
  // the checker only reports the properties every member shares.
  const matches = componentSignatures(analysis, type);
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

  const byName = new Map<string, Occurrence[]>();
  for (const member of propsTypes) {
    for (const property of checker.getPropertiesOfType(member)) {
      const list = byName.get(property.name) ?? [];
      list.push({ symbol: property, type: checker.getTypeOfSymbolAtLocation(property, located) });
      byName.set(property.name, list);
    }
  }

  const defaults = new Map([
    ...defaultPropsDefaults(checker, type),
    ...implementationDefaults(checker, located),
  ]);

  const props: PropInfo[] = [];
  const inherited: ts.Symbol[] = [];
  for (const [name, occurrences] of byName) {
    const own = occurrences.filter(({ symbol: property }) => {
      const propertyDeclaration = declarationOf(property);
      return !propertyDeclaration || !isExternal(analysis, propertyDeclaration.getSourceFile());
    });
    if (own.length === 0) {
      inherited.push(occurrences[0]!.symbol);
      continue;
    }

    const rendered = own.map(({ symbol: property, type: propType }) => {
      const declared = typeText(checker, property, !!(property.flags & ts.SymbolFlags.Optional));
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

    const doc = jsDoc(checker, own[0]!.symbol);
    const defaultValue = doc.defaultValue ?? defaults.get(name);
    props.push({
      name,
      type: text,
      // Literal unions already say it all in `values`.
      ...(resolved && !values ? { resolved } : {}),
      ...(values ? { values } : {}),
      // Required only when every member of a props union has it, and requires it.
      required:
        occurrences.length === propsTypes.size &&
        occurrences.every(({ symbol: property }) => !(property.flags & ts.SymbolFlags.Optional)),
      ...doc,
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    });
  }
  props.sort((a, b) => a.name.localeCompare(b.name));

  const inherits = groupInherited(analysis, inherited);
  const { description, deprecated } = jsDoc(checker, symbol);
  const file = located.getSourceFile();
  const typeParameters = matches
    .map(({ signature }) => typeParametersOf(checker, signature, located))
    .find((parameters) => parameters !== undefined);
  const info: ComponentInfo = {
    name: candidate.name,
    ...(typeParameters ? { typeParameters } : {}),
    sourceFilePath: path.relative(root, file.fileName).split(path.sep).join("/"),
    line: file.getLineAndCharacterOfPosition(located.getStart(file)).line + 1,
    ...(description ? { description } : {}),
    ...(deprecated !== undefined ? { deprecated } : {}),
    props,
    inherits,
  };
  const inheritedCount = inherits.reduce((total, group) => total + group.props.length, 0);
  if (props.length === 0 && inheritedCount > 0) {
    analysis.warnings.push(
      `${candidate.name} has no own props (all ${inheritedCount} props are inherited).`,
    );
  }
  return info;
}
