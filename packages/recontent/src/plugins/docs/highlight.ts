/**
 * Build-time syntax highlighting for TS/JSX examples. Deliberately small: a single
 * regex pass, no nesting (template literal `${}` bodies stay plain), no dependency.
 */
const TOKENS = [
  ["comment", /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
  ["string", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\[\s\S])*`/],
  ["number", /\b\d[\d_]*(?:\.\d+)?\b/],
  // `<Tag` / `</Tag`, but not generics (`Array<string>`) or comparisons (`a < b`).
  ["tag", /(?<![\w$)\]])<\/?[A-Za-z][\w.:-]*/],
  // `name=` after whitespace, which in practice means a JSX attribute.
  ["attr", /(?<=\s)[A-Za-z_][\w-]*(?==[^=])/],
  [
    "keyword",
    /\b(?:as|async|await|const|default|else|export|false|from|function|if|import|interface|let|new|null|return|true|type|typeof|undefined|var)\b/,
  ],
  ["fn", /[A-Za-z_$][\w$]*(?=\()/],
] as const;

const PATTERN = new RegExp(TOKENS.map(([name, re]) => `(?<${name}>${re.source})`).join("|"), "g");

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const span = (kind: string, text: string) => `<span class="tk-${kind}">${escapeHtml(text)}</span>`;

export function highlight(code: string): string {
  let out = "";
  let last = 0;
  for (const match of code.matchAll(PATTERN)) {
    const kind = TOKENS.find(([name]) => match.groups?.[name] !== undefined)![0];
    const text = match[0];
    out += escapeHtml(code.slice(last, match.index));
    if (kind === "tag") {
      const bracket = text.startsWith("</") ? "</" : "<";
      out += escapeHtml(bracket) + span(kind, text.slice(bracket.length));
    } else {
      out += span(kind, text);
    }
    last = match.index + text.length;
  }
  return out + escapeHtml(code.slice(last));
}
