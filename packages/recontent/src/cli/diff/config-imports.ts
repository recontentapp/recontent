import ts from "typescript";

function isAllowedSpecifier(specifier: string): boolean {
  return specifier === "recontent" || specifier.startsWith("recontent/");
}

function collectFromNode(node: ts.Node, external: Set<string>): void {
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
      const specifier = node.moduleSpecifier.text;
      if (!isAllowedSpecifier(specifier)) external.add(specifier);
    }
    return;
  }

  if (ts.isExportDeclaration(node)) {
    if (node.isTypeOnly) return;
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (!isAllowedSpecifier(specifier)) external.add(specifier);
    }
    return;
  }

  if (ts.isImportEqualsDeclaration(node)) {
    if (
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      const specifier = node.moduleReference.expression.text;
      if (!isAllowedSpecifier(specifier)) external.add(specifier);
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
      const specifier = node.arguments[0]!.text;
      if (!isAllowedSpecifier(specifier)) external.add(specifier);
    }
  }

  ts.forEachChild(node, (child) => collectFromNode(child, external));
}

export function findExternalImports(source: string, fileName: string): string[] {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext, true);
  const external = new Set<string>();
  ts.forEachChild(sourceFile, (node) => collectFromNode(node, external));
  return Array.from(external);
}
