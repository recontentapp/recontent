import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function isAllowedSpecifier(specifier: string): boolean {
  return specifier === "recontent" || specifier.startsWith("recontent/");
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function collectFromNode(node: ts.Node, specifiers: Set<string>): void {
  if (ts.isImportDeclaration(node)) {
    if (node.importClause?.isTypeOnly) return;
    if (
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      node.importClause.namedBindings.elements.every((element) => element.isTypeOnly)
    ) {
      return;
    }
    if (ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text);
    }
    return;
  }

  if (ts.isExportDeclaration(node)) {
    if (node.isTypeOnly) return;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifiers.add(node.moduleSpecifier.text);
    }
    return;
  }

  if (ts.isImportEqualsDeclaration(node)) {
    if (
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specifiers.add(node.moduleReference.expression.text);
    }
    return;
  }

  if (ts.isCallExpression(node)) {
    const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
    const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
    if (
      (isDynamicImport || isRequire) &&
      node.arguments.length > 0 &&
      ts.isStringLiteral(node.arguments[0]!)
    ) {
      specifiers.add(node.arguments[0]!.text);
    }
  }

  ts.forEachChild(node, (child) => collectFromNode(child, specifiers));
}

/** Collects every static/dynamic import & require specifier in a source file. */
function collectAllSpecifiers(source: string, fileName: string): string[] {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const specifiers = new Set<string>();
  ts.forEachChild(sourceFile, (node) => collectFromNode(node, specifiers));
  return Array.from(specifiers);
}

/** Specifiers that are not the `recontent` package (or a `recontent/*`
 *  subpath) — includes relative imports, matching the original semantics
 *  this was extracted from. */
export function findExternalImports(source: string, fileName: string): string[] {
  return collectAllSpecifiers(source, fileName).filter(
    (specifier) => !isAllowedSpecifier(specifier),
  );
}

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"];

function resolveRelativeFile(fromFile: string, specifier: string): string | undefined {
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...RESOLVABLE_EXTENSIONS.map((ext) => `${base}${ext}`)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  // Directory import — try index.*
  for (const ext of RESOLVABLE_EXTENSIONS) {
    const indexCandidate = path.join(base, `index${ext}`);
    if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
      return indexCandidate;
    }
  }
  return undefined;
}

/**
 * Recursively resolves relative import/require/export specifiers starting
 * from `entry`, returning the full set of local files reachable from it
 * (including `entry` itself). Used to watch every file a config depends on,
 * not just the config file — a config that splits tokens across files
 * (`./tokens/colors.ts`, a shared preset, ...) is the normal shape of a real
 * design system.
 */
export function collectLocalImports(entry: string): Set<string> {
  const visited = new Set<string>();
  const queue = [path.resolve(entry)];

  while (queue.length > 0) {
    const current = queue.pop()!;
    if (visited.has(current)) continue;
    if (!fs.existsSync(current)) continue;
    visited.add(current);

    let source: string;
    try {
      source = fs.readFileSync(current, "utf-8");
    } catch {
      continue;
    }

    const specifiers = collectAllSpecifiers(source, current);
    for (const specifier of specifiers) {
      if (!isRelativeSpecifier(specifier)) continue;
      const resolved = resolveRelativeFile(current, specifier);
      if (resolved && !visited.has(resolved)) {
        queue.push(resolved);
      }
    }
  }

  return visited;
}
