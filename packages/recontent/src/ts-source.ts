export type SourceValue = { value: string; source?: true };
export type SourceTree = { [key: string]: SourceTree | SourceValue };

function isSourceValue(value: SourceTree | SourceValue): value is SourceValue {
  return typeof (value as SourceValue).value === "string";
}

function escapeLineTerminators(value: string): string {
  return value
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function escapeString(value: string): string {
  return escapeLineTerminators(value.replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
}

export function escapeTemplateLiteral(value: string): string {
  return escapeLineTerminators(
    value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${"),
  );
}

export function isNumericKey(key: string): boolean {
  return /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(key);
}

export function quotedKey(key: string): string {
  return isNumericKey(key) ? key : JSON.stringify(key);
}

export function propertyAccess(root: string, path: readonly string[]): string {
  return path.reduce(
    (reference, segment) =>
      /^[A-Za-z_$][\w$]*$/.test(segment)
        ? `${reference}.${segment}`
        : /^(?:0|[1-9]\d*)$/.test(segment)
          ? `${reference}[${segment}]`
          : `${reference}[${JSON.stringify(segment)}]`,
    root,
  );
}

export function setTreeValue(
  tree: SourceTree,
  path: readonly string[],
  value: SourceValue | SourceTree,
): void {
  let current = tree;
  for (const segment of path.slice(0, -1)) {
    const child = current[segment];
    if (!child || isSourceValue(child)) {
      current[segment] = Object.create(null) as SourceTree;
    }
    current = current[segment] as SourceTree;
  }
  const key = path[path.length - 1];
  if (!key) {
    throw new Error("Cannot generate a token value without a path.");
  }
  current[key] = value;
}

export function formatTree(tree: SourceTree, indent = "", contract = false): string {
  const entries = Object.entries(tree);
  if (entries.length === 0) {
    return "{}";
  }

  const lines = entries.map(([key, value]) => {
    const keySource = JSON.stringify(key);
    if (isSourceValue(value)) {
      const serialized = contract
        ? "null"
        : value.source
          ? value.value
          : `'${escapeString(value.value)}'`;
      return `${indent}  ${keySource}: ${serialized},`;
    }
    return `${indent}  ${keySource}: ${formatTree(value, `${indent}  `, contract)},`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}
