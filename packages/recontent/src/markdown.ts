const MARKDOWN_SPECIAL_RE = /[\\`*_[\]<>|]/g;

/** Escapes `text` so Markdown renders it literally; line breaks become `newline`. */
export function escapeText(text: string, newline = " "): string {
  return text.replace(MARKDOWN_SPECIAL_RE, "\\$&").replace(/\r?\n/g, newline);
}

function codeSpan(text: string): string {
  const escaped = text.replace(/\|/g, "\\|");
  if (escaped === "") return "";
  const longestRun = Math.max(0, ...(escaped.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longestRun + 1);
  const needsPadding =
    longestRun > 0 ||
    escaped.startsWith("`") ||
    escaped.endsWith("`") ||
    ((escaped.startsWith(" ") || escaped.endsWith(" ")) && escaped.trim().length > 0);
  return needsPadding ? `${fence} ${escaped} ${fence}` : `${fence}${escaped}${fence}`;
}

/**
 * Wraps `text` in a code span that is safe inside a table cell. Backticks in
 * the text are kept: the fence is one longer than the longest run inside it.
 * Multi-line text splits spans around `<br>` so `<br>` is rendered as a line
 * break rather than literal characters inside backticks.
 */
export function code(text: string): string {
  if (text === "") return "";
  return text.split(/\r?\n/).map(codeSpan).join("<br>");
}
