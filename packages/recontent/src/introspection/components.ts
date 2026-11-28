import type { Logger } from "../logger.js";
import ts from "typescript";
import type { TypeStore } from "./types.js";

/** `component` is set when the warning is about one component (or one of its props), and absent when it concerns the whole project. */
export type IntrospectionWarning = { message: string; component?: string };

export type Analysis = {
  program: ts.Program;
  checker: ts.TypeChecker;
  reactNode: ts.Type;
  logger: Logger;
  /** The project types the props mention, filled in while they are described. */
  types: TypeStore;
  /** Absolute paths of the files `@example`/`@usage` tags pointed to and that could be read. */
  docFiles: Set<string>;
  /** Absolute paths of `@example`/`@usage`/`@stories` files that did not exist during this run (for cache invalidation). */
  missingDocFiles?: Set<string>;
  /** Memoized interface ancestor sets for `groupInherited`. */
  ancestorsCache?: Map<ts.Symbol, Set<ts.Symbol>>;
  /** Reported by the CLI, not part of what plugins see. */
  warnings: IntrospectionWarning[];
};

/** A signature through which a type renders, and why it is only a guess when it is one. */
type Match = { signature: ts.Signature; loose?: string };

export type Candidate = {
  /** Export name, dotted for subcomponents. */
  name: string;
  /** Alias-resolved symbol, pointing at the component's own declaration when possible. */
  symbol: ts.Symbol;
  type: ts.Type;
  /** The signatures through which it renders, at least one. */
  matches: Match[];
};

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

export function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

const REACT_TYPES = /[\\/]@types[\\/]react[\\/](?:ts\d+\.\d+[\\/])?index\.d\.ts$/;

/**
 * `ReactNode` from the copy of `@types/react` that `react` resolves to from
 * the entry. Monorepos often have two, and a component typed against the other
 * one would not be assignable to this one.
 */
export function findReactNode(
  program: ts.Program,
  checker: ts.TypeChecker,
  entry: string,
): ts.Type | undefined {
  const resolved = ts.resolveModuleName("react", entry, program.getCompilerOptions(), ts.sys)
    .resolvedModule?.resolvedFileName;
  const file =
    (resolved && program.getSourceFile(resolved)) ||
    program.getSourceFiles().find((source) => REACT_TYPES.test(source.fileName));
  const moduleSymbol = file && checker.getSymbolAtLocation(file);
  const symbol =
    moduleSymbol && checker.getExportsOfModule(moduleSymbol).find((s) => s.name === "ReactNode");
  return symbol && checker.getDeclaredTypeOfSymbol(symbol);
}

function constituents(type: ts.Type): ts.Type[] {
  return type.isUnion() ? type.types : [type];
}

function isReactClass(checker: ts.TypeChecker, type: ts.Type): boolean {
  const symbol = type.symbol;
  if (
    (symbol?.name === "Component" || symbol?.name === "PureComponent") &&
    symbol.declarations?.some((declaration) =>
      REACT_TYPES.test(declaration.getSourceFile().fileName),
    )
  ) {
    return true;
  }
  const target = type.isClassOrInterface() ? type : (type as ts.TypeReference).target;
  return (
    !!target?.isClassOrInterface() &&
    checker.getBaseTypes(target).some((base) => isReactClass(checker, base))
  );
}

const NON_PROPS_PRIMITIVE_FLAGS =
  ts.TypeFlags.StringLike |
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.BigIntLike |
  ts.TypeFlags.ESSymbolLike;

function hasValidPropsParameter(checker: ts.TypeChecker, signature: ts.Signature): boolean {
  if (signature.parameters.length > 2) return false;
  const first = signature.parameters[0];
  if (!first) return true;
  const paramType = checker.getNonNullableType(checker.getTypeOfSymbol(first));
  // Reject plain helper functions like `FormatBadge(count: number): JSX.Element`.
  if (paramType.flags & NON_PROPS_PRIMITIVE_FLAGS) return false;
  return true;
}

function isObjectRenderPart(checker: ts.TypeChecker, part: ts.Type): boolean {
  if (part.flags & ts.TypeFlags.Object) return true;
  if (part.flags & ts.TypeFlags.TypeParameter) {
    const constraint = checker.getBaseConstraintOfType(part);
    if (constraint) {
      return constituents(checker.getNonNullableType(constraint)).some(
        (c) => (c.flags & ts.TypeFlags.Object) !== 0,
      );
    }
  }
  return false;
}

/**
 * The signatures through which `type` is rendered: call signatures returning
 * something React can render, or construct signatures of classes with `render`.
 * Works the same for plain functions, `FC`, `memo`, `forwardRef`, `lazy` and
 * classes, because the checker has already resolved all of them.
 */
function componentSignatures(analysis: Analysis, type: ts.Type): Match[] {
  const { checker, reactNode } = analysis;
  const matches: Match[] = [];

  for (const member of constituents(type)) {
    for (const signature of member.getCallSignatures()) {
      if (!hasValidPropsParameter(checker, signature)) continue;
      // `FC` returns `ReactNode | Promise<ReactNode>`, which only fits once awaited.
      const returned = signature.getReturnType();
      const renderable = [returned, checker.getAwaitedType(returned)].find(
        (candidate) => candidate && checker.isTypeAssignableTo(candidate, reactNode),
      );
      if (!renderable) continue;
      // `string`/`null` alone are assignable to ReactNode but never a component.
      const parts = constituents(checker.getNonNullableType(renderable));
      if (parts.some((part) => isObjectRenderPart(checker, part))) {
        matches.push({ signature });
      } else if (parts.some((part) => part.flags & ts.TypeFlags.Any)) {
        // Untyped JS (`allowJs`) returns `any`, which fits anything.
        matches.push({ signature, loose: "it returns `any`" });
      }
    }
    for (const signature of member.getConstructSignatures()) {
      const instance = signature.getReturnType();
      if (!instance.getProperty("render")) continue;
      matches.push({
        signature,
        ...(isReactClass(checker, instance)
          ? {}
          : { loose: "it is a class with a `render` member that does not extend React.Component" }),
      });
    }
  }
  return matches;
}

function isObjectLike(checker: ts.TypeChecker, type: ts.Type): boolean {
  return (
    (type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) !== 0 &&
    !checker.isArrayType(type)
  );
}

export function findComponents(
  analysis: Analysis,
  entry: string,
  exclude: readonly string[] = [],
): Candidate[] {
  const { program, checker, logger, warnings } = analysis;
  const skipped = new Set(exclude);
  const found: Candidate[] = [];
  let valueExports = 0;

  const sourceFile = program.getSourceFile(entry);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`introspection.entry "${entry}" has no exports.`);
  }

  const visit = (name: string, exported: ts.Symbol, nested: boolean) => {
    if (skipped.has(name)) {
      logger.debug(`introspection: skipped excluded export ${name}.`);
      return;
    }
    const symbol = resolveAlias(checker, exported);
    if (!(symbol.flags & ts.SymbolFlags.Value)) return;

    if (!nested) valueExports += 1;

    const type = checker.getTypeOfSymbol(symbol);
    const matches = componentSignatures(analysis, type);
    if (matches.length > 0) {
      found.push({ name, symbol, type, matches });
      const loose = matches.every((match) => match.loose) ? matches[0]!.loose : undefined;
      if (loose) {
        warnings.push({
          message: `${name} is treated as a component only because ${loose}. Add it to \`exclude\` if it is not one.`,
          component: name,
        });
      }
    } else {
      logger.debug(`introspection: ${name} is not a React component.`);
    }

    // One level of subcomponents: `Object.assign(Tabs, { Item })`, `Tabs.Item = …`,
    // `export * as Dialog from …` and plain `{ Root, Item }` objects.
    if (nested || !isObjectLike(checker, type)) return;
    for (const member of checker.getPropertiesOfType(type)) {
      if (PASCAL_CASE.test(member.name)) visit(`${name}.${member.name}`, member, true);
    }
  };

  for (const exported of checker.getExportsOfModule(moduleSymbol)) {
    if (PASCAL_CASE.test(exported.name)) visit(exported.name, exported, false);
    else logger.debug(`introspection: ignored export ${exported.name} (not PascalCase).`);
  }
  if (found.length === 0 && valueExports > 0) {
    warnings.push({
      message:
        `No React components found in "${entry}" although it exports ${valueExports} PascalCase value(s). ` +
        "Check that @types/react resolves from the entry and that the components are typed against it.",
    });
  }
  return found;
}
