import type { ReactNode } from "react";

export type Line = { code: string; squiggle?: string };

export const lines = (source: string): Line[] => source.split("\n").map((code) => ({ code }));

type Language = "ts" | "css";

// Each capture group is colored by the class at the same position: comment, string, keyword, name.
const grammars: Record<Language, RegExp> = {
  ts: /(\/\/.*$|\/\*.*\*\/)|("[^"]*")|(\b(?:const|export|default|as|type|keyof|typeof)\b)|(\b(?:defineReferenceTokens|defineSystemTokens|defineComponentTokens|defineTheme|defineConfig|tokens|css|tailwind|typescript|typescriptNative|dtcg|docs)\b(?!:))/g,
  css: /(\/\*.*\*\/)|(#[0-9a-fA-F]{3,8}\b)|(^[.:][\w-]+|\bvar(?=\())|(--[\w-]+)/g,
};
const classNames = ["lp-c", "lp-s", "lp-k", "lp-f"];

/** Tiny syntax coloring: comments, strings or colors, keywords or selectors, and names. */
function Code({ line, language }: { line: string; language: Language }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(grammars[language])) {
    const start = match.index;
    if (start > last) parts.push(line.slice(last, start));
    parts.push(
      <span key={start} className={classNames[match.findIndex((group, i) => i > 0 && group) - 1]}>
        {match[0]}
      </span>,
    );
    last = start + match[0].length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return <>{parts}</>;
}

function CodeLine({ line, language }: { line: Line; language: Language }) {
  const at = line.squiggle ? line.code.indexOf(line.squiggle) : -1;
  if (!line.squiggle || at < 0) return <Code line={line.code} language={language} />;
  return (
    <>
      <Code line={line.code.slice(0, at)} language={language} />
      <span className="lp-squiggle">{line.squiggle}</span>
      <Code line={line.code.slice(at + line.squiggle.length)} language={language} />
    </>
  );
}

export function CodePanel({
  title,
  code,
  language = "ts",
  error,
  tone,
}: {
  title?: string;
  code: Line[];
  language?: Language;
  error?: string;
  tone?: "coral" | "green" | "blue";
}) {
  return (
    <figure className={`lp-code${tone ? ` lp-code-${tone}` : ""}`}>
      {title ? <figcaption className="lp-code-title">{title}</figcaption> : null}
      <pre>
        <code>
          {code.map((line, index) => (
            <span key={index} className="lp-line">
              <CodeLine line={line} language={language} />
            </span>
          ))}
        </code>
      </pre>
      {error ? (
        <p className="lp-error">
          <strong>error</strong> {error}
        </p>
      ) : null}
    </figure>
  );
}
