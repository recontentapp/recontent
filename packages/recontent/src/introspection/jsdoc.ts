import type { Documentation, ExampleInfo, ExternalLink } from "@recontentapp/core";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Analysis } from "./components.js";

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

/** A `./relative` path, and only that. */
function relativePath(text: string): string | undefined {
  return /^\s*(\.\.?\/\S*)\s*$/.exec(text)?.[1];
}

/** `<caption>Title</caption>` then the code, optionally fenced, or a `./relative` path to a file holding it. */
function parseExample(text: string): { title?: string; code?: string; file?: string } | undefined {
  let body = text;
  const caption = /^\s*<caption>([\s\S]*?)<\/caption>\s*/.exec(body);
  if (caption) body = body.slice(caption[0].length);
  const title = caption?.[1]?.trim();
  const named = title ? { title } : {};
  const file = relativePath(body);
  if (file) return { ...named, file };
  const fenced = /^\s*```[^\n]*\n([\s\S]*?)\n?\s*```\s*$/.exec(body);
  const code = dedent(fenced ? fenced[1]! : body);
  return code ? { ...named, code } : undefined;
}

/** `<caption>Title</caption> https://…`, the caption being optional. Only absolute http(s) URLs: they end up in `href`s. */
function parseLink(text: string): ExternalLink | undefined {
  const caption = /^\s*<caption>([\s\S]*?)<\/caption>\s*/.exec(text);
  const title = caption?.[1]?.trim();
  const url = text.slice(caption?.[0].length ?? 0).trim();
  if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) return undefined;
  return { ...(title ? { title } : {}), url };
}

/** The file an `@example` or `@usage` tag points to, read verbatim, or a warning and nothing when it can't be. */
function readFile(
  analysis: Analysis,
  symbol: ts.Symbol,
  tag: string,
  file: string,
): string | undefined {
  const declaration = symbol.declarations?.[0];
  const absolute = path.resolve(
    declaration ? path.dirname(declaration.getSourceFile().fileName) : ".",
    file,
  );
  try {
    const code = fs.readFileSync(absolute, "utf8").trimEnd();
    analysis.docFiles.add(absolute);
    return code || undefined;
  } catch {
    analysis.warnings.push(`${symbol.getName()}: @${tag} file ${file} not found.`);
    return undefined;
  }
}

export function jsDoc(analysis: Analysis, symbol: ts.Symbol): JsDoc {
  const { checker } = analysis;
  const tags = symbol.getJsDocTags(checker);
  const tag = (name: string) => tags.find((candidate) => candidate.name === name);
  const plain = (name: string) => {
    const found = tag(name);
    return found && ts.displayPartsToString(found.text).trim();
  };

  const description = render(symbol.getDocumentationComment(checker));
  const renderedUsage = render(tag("usage")?.text);
  const usageFile = relativePath(renderedUsage.text);
  // The file is markdown, where `{@link}` is plain text: no link targets to resolve.
  const usage: Rendered = usageFile
    ? { text: readFile(analysis, symbol, "usage", usageFile) ?? "", targets: [] }
    : renderedUsage;
  const deprecatedTag = tag("deprecated");
  const deprecated = deprecatedTag && render(deprecatedTag.text);
  const experimentalTag = tag("experimental");
  const experimental = experimentalTag && render(experimentalTag.text);
  const defaultValue = plain("default") || plain("defaultValue");
  const examples = tags
    .filter((candidate) => candidate.name === "example")
    .map((candidate) => parseExample(ts.displayPartsToString(candidate.text)))
    .flatMap((example): ExampleInfo[] => {
      if (!example) return [];
      const { file, title } = example;
      const code = file ? readFile(analysis, symbol, "example", file) : example.code;
      return code ? [{ ...(title ? { title } : {}), code }] : [];
    });
  const externalLinks = tags
    .filter((candidate) => candidate.name === "link")
    .flatMap((candidate): ExternalLink[] => {
      const text = ts.displayPartsToString(candidate.text);
      const link = parseLink(text);
      if (!link)
        analysis.warnings.push(`${symbol.getName()}: @link ${text} is not an http(s) URL.`);
      return link ? [link] : [];
    });
  const targets = [description, usage, deprecated, experimental].flatMap(
    (part) => part?.targets ?? [],
  );

  return {
    ...(description.text ? { description: description.text } : {}),
    ...(deprecated ? { deprecated: deprecated.text || true } : {}),
    ...(experimental ? { experimental: experimental.text || true } : {}),
    ...(examples.length > 0 ? { examples } : {}),
    ...(externalLinks.length > 0 ? { externalLinks } : {}),
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
