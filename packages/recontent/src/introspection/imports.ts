import path from "node:path";
import type { IntrospectionConfigInput } from "./model.js";
import ts from "typescript";
import type { Analysis } from "./components.js";

const EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;

/** `src/ui/Badge/index.ts` → `ui/Badge`, relative to `root` (`src`); undefined outside of it. */
function specifierOf(file: string, root: string, prefix: string): string | undefined {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (relative.startsWith("..") || path.isAbsolute(relative)) return undefined;
  const module = relative.replace(EXTENSION, "").replace(/(?:^|\/)index$/, "");
  return module ? `${prefix}${module}` : undefined;
}

/**
 * A function from a component's name to the statement that imports it, or
 * `undefined` when the config says nothing about imports. A dotted name
 * (`Tabs.Item`) imports its root component.
 */
export function createImportResolver(
  analysis: Analysis,
  options: {
    entry: string;
    root: string;
    importPath: IntrospectionConfigInput["importPath"];
  },
): ((name: string) => string | undefined) | undefined {
  const { importPath } = options;
  if (importPath === undefined) return undefined;
  const { checker, program } = analysis;
  const sourceFile = program.getSourceFile(options.entry);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  const exported = new Map(
    (moduleSymbol ? checker.getExportsOfModule(moduleSymbol) : []).map((symbol) => [
      symbol.name,
      symbol,
    ]),
  );

  const isExported = (symbol: ts.Symbol): boolean => {
    const declaration = symbol.declarations?.[0];
    const file = declaration?.getSourceFile();
    const module = file && checker.getSymbolAtLocation(file);
    return (
      !!module &&
      checker.getExportsOfModule(module).some((other) => other.declarations?.[0] === declaration)
    );
  };

  return (name) => {
    const local = name.split(".")[0]!;
    if (typeof importPath === "string")
      return `import { ${local} } from ${JSON.stringify(importPath)}`;

    const barrelExport = exported.get(local);
    if (!barrelExport) return undefined;
    // From the barrel's export to the declaration: the last symbol that a module exports is the
    // one the component's own file exposes, `default` in `export { default as Card }`.
    let defining = barrelExport;
    for (
      let current: ts.Symbol | undefined = barrelExport, depth = 0;
      current && depth < 10;
      current =
        current.flags & ts.SymbolFlags.Alias
          ? checker.getImmediateAliasedSymbol(current)
          : undefined,
        depth++
    ) {
      if (isExported(current)) defining = current;
    }
    const file = defining.declarations?.[0]?.getSourceFile();
    if (!file) return undefined;
    const specifier = specifierOf(
      file.fileName,
      path.resolve(options.root, importPath.root),
      importPath.prefix ?? "",
    );
    if (!specifier) return undefined;

    const target = JSON.stringify(specifier);
    if (defining.name === "default") return `import ${local} from ${target}`;
    return defining.name === local
      ? `import { ${local} } from ${target}`
      : `import { ${defining.name} as ${local} } from ${target}`;
  };
}
