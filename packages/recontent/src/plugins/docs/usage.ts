import { Marked } from "marked";
import { highlight } from "./highlight.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HIGHLIGHTED = new Set(["", "ts", "tsx", "js", "jsx", "typescript", "javascript"]);

/** Relative links, or absolute ones over http(s) / mailto: anything else (`javascript:`) is left as text. */
function isSafeHref(href: string): boolean {
  // Browsers ignore whitespace and control characters inside a URL's scheme.
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(href.replace(/[\s\p{Cc}]/gu, ""))?.[1];
  return !scheme || ["http", "https", "mailto"].includes(scheme.toLowerCase());
}

const markdown = new Marked({
  renderer: {
    // Authored HTML is shown as text, never injected into the page.
    html: ({ text }) => escapeHtml(text),
    code: ({ text, lang }) => {
      const language = (lang ?? "").split(/\s/)[0]!.toLowerCase();
      return `<pre><code>${HIGHLIGHTED.has(language) ? highlight(text) : escapeHtml(text)}</code></pre>\n`;
    },
    // The section's own heading is an h4: the usage's headings sit below it.
    heading({ tokens, depth }) {
      const level = Math.min(depth + 4, 6);
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      if (!isSafeHref(href)) return text;
      const external = /^https?:/i.test(href);
      return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ""}${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
    },
  },
});

/** Renders a component's `@usage` markdown (GFM) as HTML. */
export function renderUsage(text: string): string {
  return markdown.parse(text, { async: false });
}
