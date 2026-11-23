import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultPagesDir = path.join(docsRoot, "src/pages");

const BANNED_WORD_PATTERNS = [
  { regex: /\bsimply\b/gi, label: 'banned filler word "simply"' },
  { regex: /\bjust\b/gi, label: 'banned filler word "just"' },
  { regex: /\beasily\b/gi, label: 'banned filler word "easily"' },
  { regex: /\butili[sz]e[sd]?\b/gi, label: 'banned word "utilize"' },
  { regex: /\bin order to\b/gi, label: 'banned phrase "in order to"' },
  { regex: /\bleverage[sd]?\b/gi, label: 'banned word "leverage"' },
  { regex: /\bvery\b/gi, label: 'banned filler word "very"' },
];

const WARNING_PATTERNS = [
  { regex: /\bshould\b/gi, label: 'avoid "should"; use "must" or rewrite directly' },
  { regex: /\bcolours?\b/gi, label: 'use US spelling "color"' },
  { regex: /\b(?:e\.g\.|i\.e\.|etc\.)/gi, label: "avoid Latin abbreviations (e.g., i.e., etc.)" },
  {
    regex:
      /\b(?:sets?|setting)\s+up\b|\b(?:picks?|picked|picking)\s+up\b|\b(?:turns?|turned|turning)\s+(?:on|off)\b|\b(?:looks?|looked|looking)\s+up\b|\b(?:finds?|found|finding)\s+out\b|\b(?:points?|pointed|pointing)\s+out\b|\b(?:figures?|figured|figuring)\s+out\b|\b(?:opts?|opted|opting)\s+(?:in|out)\b|\b(?:breaks?|broke|broken|breaking)\s+down\b|\b(?:go(?:es)?|went|going)\s+through\b|\b(?:checks?|checked|checking)\s+out\b/gi,
    label: "avoid phrasal verbs",
  },
];

const PASSIVE_ALLOWLIST = new Set([
  "deprecated",
  "inherited",
  "configured",
  "installed",
  "generated",
  "scoped",
  "nested",
  "typed",
  "stamped",
  "resolved",
  "shared",
  "built-in",
  "self-contained",
  "type-only",
  "unrelated",
  "unmerged",
  "unrounded",
  "unbounded",
  "unchanged",
  "unquoted",
  "invalid",
  "required",
  "optional",
  "token",
]);

const PASSIVE_REGEX =
  /\b(?:is|are|was|were|be|been|being)\s+(?:not\s+)?([a-z-]+(?:ed|en)|built|caught|chosen|done|drawn|driven|fed|found|given|held|hidden|kept|known|laid|led|left|made|meant|met|paid|put|read|run|said|seen|sent|set|shown|shut|sold|spent|split|spread|struck|taken|taught|told|thought|thrown|understood|won|written)\b/gi;

const IMPERATIVE_STARTERS = new Set([
  "add",
  "avoid",
  "build",
  "call",
  "check",
  "choose",
  "commit",
  "configure",
  "copy",
  "create",
  "define",
  "delete",
  "disable",
  "do",
  "don't",
  "enable",
  "exclude",
  "export",
  "import",
  "include",
  "install",
  "keep",
  "make",
  "open",
  "pass",
  "pin",
  "place",
  "point",
  "prefer",
  "provide",
  "publish",
  "read",
  "remove",
  "replace",
  "return",
  "run",
  "select",
  "set",
  "specify",
  "start",
  "stop",
  "test",
  "update",
  "use",
  "verify",
  "wrap",
  "write",
]);

/** Collect all MDX pages under a directory, skipping root index.mdx. */
export function collectMdxFiles(dir = defaultPagesDir) {
  const results = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        if (current === dir && entry.name === "index.mdx") continue;
        results.push(fullPath);
      }
    }
  };
  walk(dir);
  return results.sort();
}

/** Strip inline code, links, and inline formatting while keeping inline code as 1 word token. */
function normalizeProse(text) {
  return text
    .replace(/`[^`]*`/g, "CODE")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split normalized prose into sentences without breaking on version numbers or abbreviations. */
function splitSentences(normalized) {
  if (!normalized) return [];
  const protectedText = normalized
    .replace(/\be\.g\./gi, "eg__")
    .replace(/\bi\.e\./gi, "ie__")
    .replace(/\betc\./gi, "etc__");
  return protectedText
    .split(/(?<=[.!?])(?=\s|$)/)
    .map((sentence) =>
      sentence.replace(/eg__/g, "e.g.").replace(/ie__/g, "i.e.").replace(/etc__/g, "etc.").trim(),
    )
    .filter(Boolean);
}

function countWords(sentence) {
  return sentence
    .split(/\s+/)
    .map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean).length;
}

function isImperativeSentence(sentence, isNumberedStep) {
  if (isNumberedStep) return true;
  const firstWord = sentence
    .split(/\s+/)[0]
    ?.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, "")
    .toLowerCase();
  return firstWord ? IMPERATIVE_STARTERS.has(firstWord) : false;
}

function checkTextBlock(
  rawText,
  line,
  issues,
  { isNumberedStep = false, checkParagraph = true } = {},
) {
  const normalized = normalizeProse(rawText);
  if (!normalized) return;

  const sentences = splitSentences(normalized);
  if (checkParagraph && sentences.length > 6) {
    issues.push({
      line,
      level: "error",
      message: `Paragraph has ${sentences.length} sentences (max 6)`,
    });
  }

  for (const sentence of sentences) {
    const words = countWords(sentence);
    const imperative = isImperativeSentence(sentence, isNumberedStep);
    const limit = imperative ? 25 : 30;
    if (words > limit) {
      issues.push({
        line,
        level: "error",
        message: `Sentence has ${words} words (max ${limit} for ${imperative ? "instruction" : "description"}): "${sentence.slice(0, 80)}${sentence.length > 80 ? "…" : ""}"`,
      });
    }
  }

  for (const { regex, label } of BANNED_WORD_PATTERNS) {
    regex.lastIndex = 0;
    const match = regex.exec(normalized);
    if (match) {
      issues.push({ line, level: "error", message: `${label} ("${match[0]}")` });
    }
  }

  PASSIVE_REGEX.lastIndex = 0;
  for (const match of normalized.matchAll(PASSIVE_REGEX)) {
    const participle = match[1].toLowerCase();
    if (PASSIVE_ALLOWLIST.has(participle)) continue;
    issues.push({
      line,
      level: "error",
      message: `possible passive voice ("${match[0]}")`,
    });
  }

  for (const { regex, label } of WARNING_PATTERNS) {
    regex.lastIndex = 0;
    const match = regex.exec(normalized);
    if (match) {
      issues.push({ line, level: "warning", message: `${label} ("${match[0]}")` });
    }
  }
}

/** Check a single MDX file against STYLE.md heuristics. */
export function checkFile(file) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const issues = [];

  let i = 0;
  // Skip YAML frontmatter.
  if (lines[0]?.trim() === "---") {
    i = 1;
    while (i < lines.length && lines[i].trim() !== "---") {
      i++;
    }
    i++;
  }

  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  let paragraphLines = [];
  let paragraphStartLine = 0;
  let paragraphIsNumbered = false;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    checkTextBlock(paragraphLines.join(" "), paragraphStartLine, issues, {
      isNumberedStep: paragraphIsNumbered,
      checkParagraph: true,
    });
    paragraphLines = [];
    paragraphStartLine = 0;
    paragraphIsNumbered = false;
  };

  for (; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    // Fenced code blocks.
    const fenceMatch = /^(`{3,}|~{3,})(.*)$/.exec(trimmed);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      const info = fenceMatch[2].trim();
      if (!inFence) {
        flushParagraph();
        inFence = true;
        fenceChar = marker[0];
        fenceLen = marker.length;
        if (!info) {
          issues.push({
            line: lineNum,
            level: "error",
            message: "Fenced code block is missing a language identifier",
          });
        }
      } else if (marker[0] === fenceChar && marker.length >= fenceLen && info === "") {
        inFence = false;
        fenceChar = "";
        fenceLen = 0;
      }
      continue;
    }

    if (inFence) continue;

    // Blank line ends paragraph.
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Skip MDX imports/exports, HTML comments, JSX lines, admonition fences, horizontal rules, headings.
    if (
      /^(?:import|export)\s+/.test(trimmed) ||
      /^<!--.*-->$/.test(trimmed) ||
      /^<\/?[A-Z]/.test(trimmed) ||
      /^:::+/.test(trimmed) ||
      /^(?:---|\*\*\*|___)$/.test(trimmed) ||
      /^#{1,6}\s+/.test(trimmed)
    ) {
      flushParagraph();
      continue;
    }

    // Markdown table rows.
    if (trimmed.startsWith("|")) {
      flushParagraph();
      // Skip separator row like | --- | --- |
      if (/^\|[\s:|-]+\|$/.test(trimmed)) continue;
      // Split cells while ignoring escaped pipes (\|) and pipes inside inline code.
      const cells = [];
      let current = "";
      let inCode = false;
      for (let c = 1; c < trimmed.length; c++) {
        const ch = trimmed[c];
        if (ch === "`") {
          inCode = !inCode;
          current += ch;
        } else if (ch === "\\" && trimmed[c + 1] === "|") {
          current += "|";
          c++;
        } else if (ch === "|" && !inCode) {
          cells.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
      if (current.trim()) cells.push(current.trim());

      for (const cell of cells) {
        checkTextBlock(cell, lineNum, issues, { checkParagraph: true });
      }
      continue;
    }

    // List items start a new block so bullet lists are checked per item.
    const bulletMatch = /^[-*+]\s+(.*)$/.exec(trimmed);
    const numberedMatch = /^\d+\.\s+(.*)$/.exec(trimmed);
    if (bulletMatch || numberedMatch) {
      flushParagraph();
      paragraphStartLine = lineNum;
      paragraphIsNumbered = Boolean(numberedMatch);
      paragraphLines.push((bulletMatch ?? numberedMatch)[1]);
      continue;
    }

    // Blockquote lines.
    const quoteMatch = /^>\s?(.*)$/.exec(trimmed);
    const text = quoteMatch ? quoteMatch[1] : trimmed;
    if (paragraphLines.length === 0) {
      paragraphStartLine = lineNum;
      paragraphIsNumbered = false;
    }
    paragraphLines.push(text);
  }

  flushParagraph();
  return issues;
}

/** Check multiple MDX files and return structured results. */
export function checkPages(files = collectMdxFiles()) {
  const results = [];
  let errors = 0;
  let warnings = 0;

  for (const file of files) {
    const issues = checkFile(file);
    for (const issue of issues) {
      if (issue.level === "error") errors++;
      else warnings++;
    }
    results.push({ file, issues });
  }

  return { results, errors, warnings };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const files =
    process.argv.length > 2 ? process.argv.slice(2).map((p) => path.resolve(p)) : collectMdxFiles();
  const { results, errors, warnings } = checkPages(files);
  for (const { file, issues } of results) {
    const rel = path.relative(docsRoot, file);
    for (const issue of issues) {
      console.log(`${rel}:${issue.line}: ${issue.level}: ${issue.message}`);
    }
  }
  console.log(`\nChecked ${files.length} files: ${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0) process.exit(1);
}
