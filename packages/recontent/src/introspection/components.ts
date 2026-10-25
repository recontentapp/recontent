import type { Logger } from "@recontentapp/core";
import ts from "typescript";

export type Analysis = {
  program: ts.Program;
  checker: ts.TypeChecker;
  reactNode: ts.Type;
  logger: Logger;
};

export type Candidate = {
  /** Export name, dotted for subcomponents. */
  name: string;
  /** Alias-resolved symbol, pointing at the component's own declaration when possible. */
  symbol: ts.Symbol;
  type: ts.Type;
};

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/;

export function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

export function findReactNode(program: ts.Program, checker: ts.TypeChecker): ts.Type | undefined {
  const file = program
    .getSourceFiles()
    .find((source) => /[\\/]@types[\\/]react[\\/]index\.d\.ts$/.test(source.fileName));
  const moduleSymbol = file && checker.getSymbolAtLocation(file);
  const symbol =
    moduleSymbol && checker.getExportsOfModule(moduleSymbol).find((s) => s.name === "ReactNode");
  return symbol && checker.getDeclaredTypeOfSymbol(symbol);
}

function constituents(type: ts.Type): ts.Type[] {
  return type.isUnion() ? type.types : [type];
}

/**
 * The signatures through which `type` is rendered: call signatures returning
 * something React can render, or construct signatures of classes with `render`.
 * Works the same for plain functions, `FC`, `memo`, `forwardRef`, `lazy` and
 * classes, because the checker has already resolved all of them.
 */
export function componentSignatures(analysis: Analysis, type: ts.Type): ts.Signature[] {
  const { checker, reactNode } = analysis;
  const signatures: ts.Signature[] = [];

  for (const member of constituents(type)) {
    for (const signature of member.getCallSignatures()) {
      // `FC` returns `ReactNode | Promise<ReactNode>`, which only fits once awaited.
      const returned = signature.getReturnType();
      const renderable = [returned, checker.getAwaitedType(returned)].find(
        (candidate) => candidate && checker.isTypeAssignableTo(candidate, reactNode),
      );
      if (!renderable) continue;
      // `string`/`null` alone are assignable to ReactNode but never a component.
      const parts = constituents(checker.getNonNullableType(renderable));
      if (parts.some((part) => part.flags & (ts.TypeFlags.Object | ts.TypeFlags.Any))) {
        signatures.push(signature);
      }
    }
    for (const signature of member.getConstructSignatures()) {
      if (signature.getReturnType().getProperty("render")) signatures.push(signature);
    }
  }
  return signatures;
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
  const { program, checker, logger } = analysis;
  const skipped = new Set(exclude);
  const found: Candidate[] = [];

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
    // Type-only exports have no value to render.
    if (!(symbol.flags & ts.SymbolFlags.Value)) return;

    const type = checker.getTypeOfSymbol(symbol);
    if (componentSignatures(analysis, type).length > 0) {
      found.push({ name, symbol, type });
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
  return found;
}
