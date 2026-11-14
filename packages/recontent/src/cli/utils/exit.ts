import { plural } from "./format.js";

/**
 * Process-exit and top-level error formatting helpers.
 *
 * `exitWithError` sets `process.exitCode` and returns rather than calling
 * `process.exit()` directly, so pending async stdout/stderr writes are
 * allowed to drain before the process actually exits.
 */
export function exitWithError(message: string, exitCode = 1): void {
  console.error(`error: ${message}`);
  process.exitCode = exitCode;
}

/** "2 errors, 1 warning" — the closing line of a run that reported diagnostics. */
export function summarizeDiagnostics(errors: number, warnings: number): string {
  return [plural(errors, "error"), plural(warnings, "warning")].join(", ");
}

// Node's module-not-found errors append the importer chain, which only
// leaks internal install paths (e.g. `core/dist/index.mjs`).
function stripRequireStack(message: string): string {
  const index = message.indexOf("\nRequire stack:");
  return index === -1 ? message : message.slice(0, index);
}

/**
 * Renders an error and its full `cause` chain, one line per cause. A cause
 * whose message the wrapping error already quotes is skipped. The stack
 * trace is only appended when `debug` is true (i.e. `--log-level debug`).
 */
function formatErrorForReport(error: unknown, debug: boolean): string {
  const lines: string[] = [];

  let current: unknown = error;
  let previous = "";
  let prefix = "error";
  const seen = new Set<unknown>();
  while (current !== undefined && current !== null && !seen.has(current)) {
    seen.add(current);
    const message = stripRequireStack(current instanceof Error ? current.message : String(current));
    if (lines.length === 0 || !previous.includes(message)) {
      lines.push(`${prefix}: ${message}`);
      previous = message;
    }
    current = current instanceof Error ? current.cause : undefined;
    prefix = "caused by";
  }

  if (debug && error instanceof Error && error.stack) {
    lines.push("", error.stack);
  }

  return lines.join("\n");
}

export function reportError(error: unknown, debug: boolean): void {
  console.error(formatErrorForReport(error, debug));
}
