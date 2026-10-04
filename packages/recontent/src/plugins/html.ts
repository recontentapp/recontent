import {
  pathKey,
  type OutputFile,
  type RecontentPlugin,
  type TokenEntry,
  type TokenLayer,
  type TokenType,
} from "@recontentapp/core";
import { serializeValueCss } from "../serialize/values.js";
import type { GeneratorContext } from "./shared/context.js";
import { outputPlugin } from "./factory.js";

const LAYERS: TokenLayer[] = ["ref", "system", "components"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupByLayer(registry: GeneratorContext["registry"]): Record<TokenLayer, TokenEntry[]> {
  const grouped: Record<TokenLayer, TokenEntry[]> = {
    ref: [],
    system: [],
    components: [],
  };

  for (const entry of registry.values()) {
    grouped[entry.layer].push(entry);
  }

  for (const layer of LAYERS) {
    grouped[layer].sort((a, b) => pathKey(a.path).localeCompare(pathKey(b.path)));
  }

  return grouped;
}

function groupByType(entries: TokenEntry[]): Map<TokenType, TokenEntry[]> {
  const grouped = new Map<TokenType, TokenEntry[]>();

  for (const entry of entries) {
    const list = grouped.get(entry.$type) ?? [];
    list.push(entry);
    grouped.set(entry.$type, list);
  }

  return grouped;
}

function renderAlias(entry: TokenEntry): string {
  if (!entry.alias) return "";
  return `<span class="alias">→ ${escapeHtml(pathKey(entry.alias))}</span>`;
}

function renderMetadata(entry: TokenEntry): string {
  const parts: string[] = [];
  if (entry.$deprecated) {
    const reason = typeof entry.$deprecated === "string" ? `: ${entry.$deprecated}` : "";
    parts.push(`<span class="badge deprecated">Deprecated${escapeHtml(reason)}</span>`);
  }
  if (entry.$description) {
    parts.push(`<p class="description">${escapeHtml(entry.$description)}</p>`);
  }
  return parts.join("\n");
}

function renderColorEntry(entry: TokenEntry): string {
  const color = entry.$value as import("@recontentapp/core").TokenTypeMap["color"];
  const display = serializeValueCss("color", color);

  return `
    <div class="token color-token">
      <div class="swatch" style="background: ${escapeHtml(display)}"></div>
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderFontFamilyEntry(entry: TokenEntry): string {
  const fontFamily = entry.$value as import("@recontentapp/core").TokenTypeMap["fontFamily"];
  const families = fontFamily.value.join(", ");

  return `
    <div class="token font-token">
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(families)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
      <p class="font-preview" style="font-family: ${escapeHtml(families)}">The quick brown fox jumps over the lazy dog</p>
    </div>`;
}

function renderShadowEntry(entry: TokenEntry): string {
  const display = serializeValueCss(
    "shadow",
    entry.$value as import("@recontentapp/core").TokenTypeMap["shadow"],
  );

  return `
    <div class="token shadow-token">
      <div class="swatch" style="box-shadow: ${escapeHtml(display)};"></div>
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderBorderEntry(entry: TokenEntry): string {
  const display = serializeValueCss(
    "border",
    entry.$value as import("@recontentapp/core").TokenTypeMap["border"],
  );

  return `
    <div class="token border-token">
      <div class="swatch" style="border: ${escapeHtml(display)};"></div>
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderGradientEntry(entry: TokenEntry): string {
  const display = serializeValueCss(
    "gradient",
    entry.$value as import("@recontentapp/core").TokenTypeMap["gradient"],
  );

  return `
    <div class="token gradient-token">
      <div class="swatch" style="background-image: ${escapeHtml(display)};"></div>
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderTypographyEntry(entry: TokenEntry): string {
  const typography = entry.$value as import("@recontentapp/core").TokenTypeMap["typography"];
  const style = [
    `font-family: ${serializeValueCss("fontFamily", typography.fontFamily.$value)}`,
    `font-size: ${serializeValueCss("dimension", typography.fontSize.$value)}`,
    `font-weight: ${serializeValueCss("fontWeight", typography.fontWeight.$value)}`,
    `letter-spacing: ${serializeValueCss("dimension", typography.letterSpacing.$value)}`,
    `line-height: ${serializeValueCss("number", typography.lineHeight.$value)}`,
  ].join("; ");

  return `
    <div class="token typography-token">
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
      <p class="font-preview" style="${escapeHtml(style)}">The quick brown fox jumps over the lazy dog</p>
    </div>`;
}

function renderTransitionEntry(entry: TokenEntry): string {
  const transition = entry.$value as import("@recontentapp/core").TokenTypeMap["transition"];
  const display = [
    `duration: ${serializeValueCss("duration", transition.duration.$value)}`,
    `delay: ${serializeValueCss("duration", transition.delay.$value)}`,
    `timingFunction: ${serializeValueCss("cubicBezier", transition.timingFunction.$value)}`,
  ].join(", ");

  return `
    <div class="token">
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderGenericEntry(entry: TokenEntry): string {
  const display = serializeValueCss(entry.$type, entry.$value);

  return `
    <div class="token">
      <div class="token-meta">
        <code class="path">${escapeHtml(pathKey(entry.path))}</code>
        <span class="value">${escapeHtml(display)}</span>
        ${renderAlias(entry)}
        ${renderMetadata(entry)}
      </div>
    </div>`;
}

function renderTokenEntry(entry: TokenEntry): string {
  switch (entry.$type) {
    case "color":
      return renderColorEntry(entry);
    case "fontFamily":
      return renderFontFamilyEntry(entry);
    case "shadow":
      return renderShadowEntry(entry);
    case "border":
      return renderBorderEntry(entry);
    case "gradient":
      return renderGradientEntry(entry);
    case "typography":
      return renderTypographyEntry(entry);
    case "transition":
      return renderTransitionEntry(entry);
    default:
      return renderGenericEntry(entry);
  }
}

function renderLayerSection(layer: TokenLayer, entries: TokenEntry[]): string {
  if (entries.length === 0) {
    return `
      <section class="layer">
        <h2>${escapeHtml(layer)}</h2>
        <p class="empty">No tokens defined.</p>
      </section>`;
  }

  const byType = groupByType(entries);
  const typeSections = [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([type, typeEntries]) => `
        <div class="type-group">
          <h3>${escapeHtml(type)} <span class="count">(${typeEntries.length})</span></h3>
          <div class="token-list">
            ${typeEntries.map(renderTokenEntry).join("\n")}
          </div>
        </div>`,
    )
    .join("\n");

  return `
    <section class="layer">
      <h2>${escapeHtml(layer)} <span class="count">(${entries.length})</span></h2>
      ${typeSections}
    </section>`;
}

function renderThemesSection(config: GeneratorContext): string {
  const themeNames = Object.keys(config.themes);

  if (themeNames.length === 0) {
    return `
      <section class="themes">
        <h2>Themes</h2>
        <p class="empty">No themes configured.</p>
      </section>`;
  }

  const items = themeNames
    .sort()
    .map((name) => {
      const overrideCount = config.themes[name]!.size;
      return `<li><strong>${escapeHtml(name)}</strong> — ${overrideCount} ref token override${overrideCount === 1 ? "" : "s"}</li>`;
    })
    .join("\n");

  return `
    <section class="themes">
      <h2>Themes <span class="count">(${themeNames.length})</span></h2>
      <ul>${items}</ul>
    </section>`;
}

function generateHtmlReport(config: GeneratorContext): string {
  const grouped = groupByLayer(config.registry);
  const totalTokens = config.registry.size;

  const layerSections = LAYERS.map((layer) => renderLayerSection(layer, grouped[layer])).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recontent Token Report</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f8f9fa;
      --surface: #ffffff;
      --text: #1a1a1a;
      --muted: #6b7280;
      --border: #e5e7eb;
      --accent: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111827;
        --surface: #1f2937;
        --text: #f9fafb;
        --muted: #9ca3af;
        --border: #374151;
        --accent: #60a5fa;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    header {
      padding: 2rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    header p { margin: 0; color: var(--muted); }
    main { max-width: 960px; margin: 0 auto; padding: 2rem; }
    section { margin-bottom: 2.5rem; }
    h2 {
      margin: 0 0 1rem;
      font-size: 1.25rem;
      border-bottom: 2px solid var(--accent);
      padding-bottom: 0.5rem;
    }
    h3 {
      margin: 1.5rem 0 0.75rem;
      font-size: 1rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .count { font-weight: normal; color: var(--muted); font-size: 0.875rem; }
    .empty { color: var(--muted); font-style: italic; }
    .token-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .token {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.75rem 1rem;
    }
    .color-token { display: flex; align-items: center; gap: 1rem; }
    .swatch {
      width: 48px;
      height: 48px;
      border-radius: 6px;
      border: 1px solid var(--border);
      flex-shrink: 0;
    }
    .token-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 1rem; }
    .path { font-size: 0.875rem; color: var(--accent); }
    .value { font-size: 0.875rem; color: var(--muted); }
    .alias { font-size: 0.8125rem; color: var(--muted); font-style: italic; }
    .description { flex-basis: 100%; margin: 0; font-size: 0.8125rem; color: var(--muted); }
    .badge.deprecated {
      font-size: 0.75rem;
      font-weight: 600;
      color: #b45309;
      background: #fef3c7;
      border-radius: 0.25rem;
      padding: 0.125rem 0.4rem;
    }
    .font-preview { margin: 0.5rem 0 0; font-size: 1.125rem; }
    .themes ul { margin: 0; padding-left: 1.25rem; }
    .themes li { margin-bottom: 0.25rem; }
  </style>
</head>
<body>
  <header>
    <h1>Recontent Token Report</h1>
    <p>${totalTokens} token${totalTokens === 1 ? "" : "s"} across ${LAYERS.length} layers</p>
  </header>
  <main>
    ${renderThemesSection(config)}
    ${layerSections}
  </main>
</body>
</html>`;
}

export type HtmlPluginOptions = {
  outDir: string;
};

function generateHtmlFiles(ctx: GeneratorContext, _options: HtmlPluginOptions): OutputFile[] {
  return [{ filename: "tokens.html", content: generateHtmlReport(ctx) }];
}

export function html(options: HtmlPluginOptions): RecontentPlugin {
  return outputPlugin("recontent:html", options, generateHtmlFiles);
}
