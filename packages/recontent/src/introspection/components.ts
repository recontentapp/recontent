import type { Logger } from "@recontentapp/core";
import ts from "typescript";

export type Analysis = {
  program: ts.Program;
  checker: ts.TypeChecker;
  reactNode: ts.Type;
  logger: Logger;
  /** Reported by the CLI, not part of what plugins see. */
  warnings: string[];
};

/** A signature through which a type renders, and why it is only a guess when it is one. */
export type Match = { signature: ts.Signature; loose?: string };

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

const REACT_TYPES = /[\\/]@types[\\/]react[\\/]index\.d\.ts$/;

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

/**
 * The signatures through which `type` is rendered: call signatures returning
 * something React can render, or construct signatures of classes with `render`.
 * Works the same for plain functions, `FC`, `memo`, `forwardRef`, `lazy` and
 * classes, because the checker has already resolved all of them.
 */
export function componentSignatures(analysis: Analysis, type: ts.Type): Match[] {
  const { checker, reactNode } = analysis;
  const matches: Match[] = [];

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
      if (parts.some((part) => part.flags & ts.TypeFlags.Object)) {
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
    // Type-only exports have no value to render.
    if (!(symbol.flags & ts.SymbolFlags.Value)) return;

    if (!nested) valueExports += 1;

    const type = checker.getTypeOfSymbol(symbol);
    const matches = componentSignatures(analysis, type);
    if (matches.length > 0) {
      found.push({ name, symbol, type });
      const loose = matches.every((match) => match.loose) ? matches[0]!.loose : undefined;
      if (loose) {
        warnings.push(
          `${name} is treated as a component only because ${loose}. Add it to \`exclude\` if it is not one.`,
        );
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
    warnings.push(
      `No React components found in "${entry}" although it exports ${valueExports} PascalCase value(s). ` +
        "Check that @types/react resolves from the entry and that the components are typed against it.",
    );
  }
  return found;
}
