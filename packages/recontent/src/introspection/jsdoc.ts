import type { Documentation, ExampleInfo } from "@recontentapp/core";
import ts from "typescript";

/** Link names found in the comment, resolved against the known components and types once all are described. */
export type PendingLinks = {
  linkTargets?: string[];
  /** Those of the `@deprecated` text only. */
  replacementTargets?: string[];
};

type JsDoc = Documentation & PendingLinks & { defaultValue?: string };

type Rendered = { text: string; targets: string[] };

/**
 * Display parts as text, with `{@link X}` as `` `X` `` (or its label) and the
 * names it points to on the side. The checker only resolves links to symbols
 * in scope of the comment (`linkName`); the others come back as the raw
 * `linkText`, whose first word is the name.
 */
function render(parts: ts.SymbolDisplayPart[] | undefined): Rendered {
  let text = "";
  const targets: string[] = [];
  let link: { name?: string; label: string } | undefined;
  for (const part of parts ?? []) {
    if (part.kind === "link" && part.text.startsWith("{@link")) {
      link = { label: "" };
    } else if (!link) {
      text += part.text;
    } else if (part.kind === "linkName") {
      link.name = part.text.trim();
    } else if (part.kind === "linkText") {
      link.label += part.text;
    } else if (part.kind === "link") {
      let { name, label } = link;
      label = label.trim();
      if (!name) [name = "", label = ""] = label.split(/\s+(.*)/s, 2);
      if (name) targets.push(name);
      text += label || (name ? `\`${name}\`` : "");
      link = undefined;
    }
  }
  return { text: text.trim(), targets };
}

function dedent(text: string): string {
  const lines = text
    .replace(/\s+$/, "")
    .replace(/^\s*\n/, "")
    .split("\n");
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => /^\s*/.exec(line)![0].length),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
}

/** `<caption>Title</caption>` then the code, optionally fenced. */
function parseExample(text: string): ExampleInfo | undefined {
  let body = text;
  const caption = /^\s*<caption>([\s\S]*?)<\/caption>\s*/.exec(body);
  if (caption) body = body.slice(caption[0].length);
  const fenced = /^\s*```[^\n]*\n([\s\S]*?)\n?\s*```\s*$/.exec(body);
  const code = dedent(fenced ? fenced[1]! : body);
  const title = caption?.[1]?.trim();
  return code ? { ...(title ? { title } : {}), code } : undefined;
}

export function jsDoc(checker: ts.TypeChecker, symbol: ts.Symbol): JsDoc {
  const tags = symbol.getJsDocTags(checker);
  const tag = (name: string) => tags.find((candidate) => candidate.name === name);
  const plain = (name: string) => {
    const found = tag(name);
    return found && ts.displayPartsToString(found.text).trim();
  };

  const description = render(symbol.getDocumentationComment(checker));
  const usage = render(tag("usage")?.text);
  const deprecatedTag = tag("deprecated");
  const deprecated = deprecatedTag && render(deprecatedTag.text);
  const experimentalTag = tag("experimental");
  const experimental = experimentalTag && render(experimentalTag.text);
  const defaultValue = plain("default") || plain("defaultValue");
  const examples = tags
    .filter((candidate) => candidate.name === "example")
    .map((candidate) => parseExample(ts.displayPartsToString(candidate.text)))
    .filter((example) => example !== undefined);
  const targets = [description, usage, deprecated, experimental].flatMap(
    (part) => part?.targets ?? [],
  );

  return {
    ...(description.text ? { description: description.text } : {}),
    ...(deprecated ? { deprecated: deprecated.text || true } : {}),
    ...(experimental ? { experimental: experimental.text || true } : {}),
    ...(examples.length > 0 ? { examples } : {}),
    ...(usage.text ? { usage: usage.text } : {}),
    ...(defaultValue ? { defaultValue } : {}),
    ...(targets.length > 0 ? { linkTargets: targets } : {}),
    ...(deprecated?.targets.length ? { replacementTargets: deprecated.targets } : {}),
  };
}

export function categoryOf(checker: ts.TypeChecker, symbol: ts.Symbol): string | undefined {
  const tag = symbol.getJsDocTags(checker).find((candidate) => candidate.name === "category");
  return ts.displayPartsToString(tag?.text).trim() || undefined;
}
