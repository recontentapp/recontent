/**
 * Process-exit and top-level error formatting helpers.
 *
 * `exitWithError` sets `process.exitCode` and returns rather than calling
 * `process.exit()` directly, so pending async stdout/stderr writes are
 * allowed to drain before the process actually exits (§5).
 */
export function exitWithError(message: string): void {
  console.error(`Error: ${message}`);
  process.exitCode = 1;
}

export function logSuccess(message: string): void {
  console.error(message);
}

/**
 * Renders an error and its full `cause` chain, one line per cause. The stack
 * trace is only appended when `debug` is true (i.e. `--log-level debug`).
 */
export function formatErrorForReport(error: unknown, debug: boolean): string {
  const lines: string[] = [];

  let current: unknown = error;
  let prefix = "Error";
  const seen = new Set<unknown>();
  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current);
    const message = current instanceof Error ? current.message : String(current);
    lines.push(`${prefix}: ${message}`);
    current = current instanceof Error ? current.cause : undefined;
    prefix = "Caused by";
  }

  if (debug && error instanceof Error && error.stack) {
    lines.push("", error.stack);
  }

  return lines.join("\n");
}
