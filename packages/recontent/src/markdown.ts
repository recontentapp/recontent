const MARKDOWN_SPECIAL_RE = /[\\`*_[\]<>|]/g;

/** Escapes `text` so Markdown renders it literally; line breaks become `newline`. */
export function escapeText(text: string, newline = " "): string {
  return text.replace(MARKDOWN_SPECIAL_RE, "\\$&").replace(/\r?\n/g, newline);
}

/**
 * Wraps `text` in a code span that is safe inside a table cell. Backticks in
 * the text are kept: the fence is one longer than the longest run inside it.
 */
export function code(text: string): string {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  const longestRun = Math.max(0, ...(escaped.match(/`+/g) ?? []).map((run) => run.length));
  if (longestRun === 0) return `\`${escaped}\``;
  const fence = "`".repeat(longestRun + 1);
  return `${fence} ${escaped} ${fence}`;
}
