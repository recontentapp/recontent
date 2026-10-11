const MARKDOWN_SPECIAL_RE = /[\\`*_[\]<>|]/g;

/** Escapes `text` so Markdown renders it literally; line breaks become `newline`. */
export function escapeText(text: string, newline = " "): string {
  return text.replace(MARKDOWN_SPECIAL_RE, "\\$&").replace(/\r?\n/g, newline);
}

/** Wraps `text` in a code span that is safe inside a table cell. */
export function code(text: string): string {
  const escaped = text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  return `\`${escaped.replace(/`/g, "'")}\``;
}
