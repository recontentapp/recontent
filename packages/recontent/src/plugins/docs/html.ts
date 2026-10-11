import { generateCss } from "../css.js";
import type { GeneratorContext } from "../shared/context.js";
import type { DocGroup, DocToken, DocsModel } from "./model.js";

const LAYER_TITLES = { ref: "Reference", system: "System", components: "Components" } as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-");
}

const tokenId = (path: string) => `t-${path}`;
const groupId = (layer: string, path: string) => `g-${layer}-${slug(path)}`;

function previewHtml(token: DocToken): string {
  const v = `var(${token.cssVar})`;
  const style = (css: string) => `style="${escapeHtml(css)}"`;
  switch (token.type) {
    case "color":
      return `<span class="sw" ${style(`background:${v}`)}></span>`;
    case "fontFamily":
      return `<span class="sample" ${style(`font-family:${v}`)}>Aa Bb Cc 123</span>`;
    case "fontWeight":
      return `<span class="sample" ${style(`font-weight:${v}`)}>Aa Bb Cc 123</span>`;
    case "dimension":
      return `<span class="dim" ${style(`width:min(${v},100%)`)}></span>`;
    case "shadow":
      return `<span class="tile" ${style(`box-shadow:${v}`)}></span>`;
    case "border":
      return `<span class="tile" ${style(`border:${v}`)}></span>`;
    case "gradient":
      return `<span class="tile wide" ${style(`background:${v}`)}></span>`;
    case "typography": {
      const sub = (suffix: string) => `var(${token.cssVar}-${suffix})`;
      return `<span class="sample" ${style(
        `font-family:${sub("font-family")};font-size:${sub("font-size")};font-weight:${sub("font-weight")};letter-spacing:${sub("letter-spacing")};line-height:${sub("line-height")}`,
      )}>The quick brown fox</span>`;
    }
    case "transition": {
      const sub = (suffix: string) => `var(${token.cssVar}-transition-${suffix})`;
      return `<span class="track" title="Hover the row to preview"><span class="demo" ${style(
        `transition:transform ${sub("duration")} ${sub("timing-function")} ${sub("delay")}`,
      )}></span></span>`;
    }
    default:
      return "";
  }
}

function annotationsHtml(token: DocToken): string {
  const parts: string[] = [];
  if (token.description) {
    parts.push(`<p class="desc">${escapeHtml(token.description)}</p>`);
  }
  if (token.deprecated && token.deprecated !== true) {
    parts.push(`<p class="reason">${escapeHtml(token.deprecated)}</p>`);
  }
  if (token.alias) {
    parts.push(
      `<a class="alias" href="#${escapeHtml(tokenId(token.alias))}" data-goto="${escapeHtml(tokenId(token.alias))}">→ ${escapeHtml(token.alias)}</a>`,
    );
  }
  return parts.join("");
}

function nameHtml(token: DocToken): string {
  const capsule = token.deprecated ? `<span class="capsule">Deprecated</span>` : "";
  return `<code class="tname${token.deprecated ? " is-deprecated" : ""}">${escapeHtml(token.path)}</code><span class="pill">${escapeHtml(token.type)}</span>${capsule}`;
}

function valueHtml(token: DocToken): string {
  // The default is the element's text; only theme overrides need to travel as data.
  const { default: defaultValue = "", ...overrides } = token.values;
  const data =
    Object.keys(overrides).length > 0
      ? ` data-values="${escapeHtml(JSON.stringify(overrides))}"`
      : "";
  return `<span class="val-wrap"><span class="dot" title="Overridden by the selected theme"></span><code class="val"${data}>${escapeHtml(defaultValue)}</code></span>`;
}

function cardHtml(token: DocToken): string {
  return `<div class="card" id="${escapeHtml(tokenId(token.path))}">
  <div class="swatch">${previewHtml(token)}</div>
  <div class="card-body">
    <div class="name">${nameHtml(token)}</div>
    ${valueHtml(token)}
    ${annotationsHtml(token)}
  </div>
</div>`;
}

function rowHtml(token: DocToken): string {
  return `<div class="row" id="${escapeHtml(tokenId(token.path))}">
  <div class="row-main">
    <div class="name">${nameHtml(token)}</div>
    ${annotationsHtml(token)}
  </div>
  <div class="row-preview">${previewHtml(token)}</div>
  <div class="row-value">${valueHtml(token)}</div>
</div>`;
}

function groupHtml(layer: string, group: DocGroup): string {
  const isGrid = group.tokens.every((token) => token.type === "color");
  const scale = group.scale;
  const deprecated = scale?.deprecated;
  const body = isGrid
    ? `<div class="grid">${group.tokens.map(cardHtml).join("\n")}</div>`
    : `<div class="list">${group.tokens.map(rowHtml).join("\n")}</div>`;
  return `<section class="group" id="${escapeHtml(groupId(layer, group.path))}">
  <h3>${escapeHtml(group.label)} <span class="count">${group.tokens.length}</span></h3>
  ${scale?.description ? `<p class="lead">${escapeHtml(scale.description)}</p>` : ""}
  ${deprecated ? `<p class="callout"><span class="capsule">Deprecated</span>${deprecated === true ? "" : ` ${escapeHtml(deprecated)}`}</p>` : ""}
  ${body}
</section>`;
}

function tokenCss(ctx: GeneratorContext): string {
  return generateCss(ctx).replace(/<\/(style)/gi, "<\\/$1");
}

const STYLES = `
:root {
  color-scheme: light;
  --hig-bg: #ffffff;
  --hig-bg-2: #f5f5f7;
  --hig-text: #1d1d1f;
  --hig-text-2: #6e6e73;
  --hig-line: #d2d2d7;
  --hig-blue: #0071e3;
  --hig-orange: #ff9f0a;
  --hig-orange-bg: rgba(255, 159, 10, 0.14);
  --hig-orange-text: #a35f00;
  --hig-mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--hig-bg);
  color: var(--hig-text);
  font: 17px/1.47 -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
}
code { font-family: var(--hig-mono); font-size: 0.82em; }
.bar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  height: 56px; padding: 0 24px;
  background: rgba(255, 255, 255, 0.8);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--hig-line);
}
.bar h1 { margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; }
.picker { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--hig-text-2); }
.picker select {
  appearance: none; -webkit-appearance: none;
  font: inherit; font-size: 14px; color: var(--hig-text);
  padding: 5px 30px 5px 12px;
  background: var(--hig-bg-2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%236e6e73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 11px center;
  border: 1px solid var(--hig-line); border-radius: 8px; cursor: pointer;
}
.picker select:focus-visible, .tabs button:focus-visible, .side a:focus-visible, .alias:focus-visible {
  outline: 2px solid var(--hig-blue); outline-offset: 2px;
}
.tabs { display: flex; justify-content: center; padding: 28px 16px 8px; }
.seg { display: inline-flex; padding: 2px; background: var(--hig-bg-2); border-radius: 9px; }
.seg button {
  font: inherit; font-size: 14px; font-weight: 500; color: var(--hig-text);
  padding: 5px 18px; border: 0; border-radius: 7px; background: transparent; cursor: pointer;
}
.seg button[aria-selected="true"] { background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(0, 0, 0, 0.06); }
.seg .n { color: var(--hig-text-2); margin-left: 4px; font-weight: 400; }
.layout { display: grid; grid-template-columns: 240px minmax(0, 980px); gap: 40px; justify-content: center; padding: 16px 24px 96px; }
.side { position: sticky; top: 80px; align-self: start; max-height: calc(100vh - 100px); overflow: auto; font-size: 14px; }
.side nav { display: flex; flex-direction: column; gap: 2px; }
.side a { display: block; padding: 5px 10px; border-radius: 8px; color: var(--hig-text); text-decoration: none; word-break: break-word; }
.side a:hover { background: var(--hig-bg-2); }
.side a.active { color: var(--hig-blue); background: rgba(0, 113, 227, 0.08); font-weight: 500; }
.title { margin: 0 0 4px; font-size: 40px; line-height: 1.1; font-weight: 700; letter-spacing: -0.02em; }
.sub { margin: 0 0 40px; color: var(--hig-text-2); }
.group { margin-bottom: 56px; scroll-margin-top: 80px; }
.group h3 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; font-weight: 600; letter-spacing: -0.01em; }
.count { font-size: 15px; font-weight: 400; color: var(--hig-text-2); margin-left: 6px; }
.lead { margin: 0 0 16px; color: var(--hig-text-2); }
.callout { margin: 0 0 16px; padding: 10px 14px; border-radius: 12px; background: var(--hig-orange-bg); color: var(--hig-orange-text); font-size: 15px; }
.callout .capsule { margin: 0 8px 0 0; }
.empty { padding: 56px 0; text-align: center; color: var(--hig-text-2); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; margin-top: 16px; }
.card { scroll-margin-top: 80px; border: 1px solid var(--hig-line); border-radius: 18px; background: #fff; overflow: hidden; }
.card .swatch { height: 96px; background: var(--hig-bg-2); }
.card .sw { display: block; width: 100%; height: 100%; border-radius: 0; }
.card-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; }
.card .name { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; }
.card .tname { word-break: break-all; }
.list { margin-top: 16px; border: 1px solid var(--hig-line); border-radius: 18px; background: #fff; overflow: hidden; }
.row { scroll-margin-top: 80px; display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 200px) minmax(0, 1.2fr); gap: 16px; align-items: center; padding: 14px 18px; }
.row + .row { border-top: 1px solid var(--hig-bg-2); }
.row .name { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.row .tname { word-break: break-all; }
.row-preview { overflow: hidden; }
.row-value { min-width: 0; }
.val-wrap { display: inline-flex; align-items: baseline; gap: 6px; color: var(--hig-text-2); }
.val { word-break: break-word; }
.dot { display: none; width: 7px; height: 7px; border-radius: 50%; background: var(--hig-blue); flex: none; transform: translateY(-1px); }
.overridden .dot { display: inline-block; }
.pill { font-size: 12px; color: var(--hig-text-2); background: var(--hig-bg-2); border-radius: 999px; padding: 1px 9px; }
.capsule { font-size: 12px; font-weight: 600; color: var(--hig-orange-text); background: var(--hig-orange-bg); border-radius: 999px; padding: 1px 9px; }
.is-deprecated { text-decoration: line-through; text-decoration-color: var(--hig-orange); }
.desc, .reason { margin: 4px 0 0; font-size: 14px; color: var(--hig-text-2); }
.reason { color: var(--hig-orange-text); }
.alias { display: inline-block; margin-top: 4px; font-family: var(--hig-mono); font-size: 12px; color: var(--hig-blue); text-decoration: none; word-break: break-all; }
.alias:hover { text-decoration: underline; }
.flash { animation: flash 1.6s ease-out; }
@keyframes flash { 0%, 40% { background: rgba(0, 113, 227, 0.12); } 100% { background: transparent; } }
.sample { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row-preview .dim { display: block; height: 8px; min-width: 2px; border-radius: 4px; background: var(--hig-blue); }
.row-preview .sw { display: block; width: 44px; height: 44px; border-radius: 10px; }
.tile { display: block; width: 56px; height: 56px; margin: 6px; border-radius: 12px; background: #fff; }
.tile.wide { width: 100%; max-width: 160px; height: 40px; margin: 0; }
.track { display: block; width: 120px; height: 8px; border-radius: 4px; background: var(--hig-bg-2); position: relative; }
.demo { position: absolute; top: -4px; left: 0; width: 16px; height: 16px; border-radius: 50%; background: var(--hig-blue); }
.row:hover .demo { transform: translateX(104px); }
[hidden] { display: none !important; }
@media (max-width: 800px) {
  .bar { padding: 0 16px; }
  .layout { grid-template-columns: minmax(0, 1fr); gap: 16px; padding: 8px 16px 64px; }
  .side { position: static; max-height: none; }
  .side nav { flex-direction: row; overflow-x: auto; gap: 6px; padding-bottom: 4px; }
  .side a { white-space: nowrap; background: var(--hig-bg-2); }
  .title { font-size: 32px; }
  .row { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .row-preview:empty { display: none; }
}
`;

const SCRIPT = `
(function () {
  var layers = ["ref", "system", "components"];
  var tabs = document.querySelectorAll("[data-tab]");
  var panels = document.querySelectorAll("[data-panel]");
  var sides = document.querySelectorAll("[data-side]");
  var observer = null;

  function show(layer) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === layer)); });
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== layer; });
    sides.forEach(function (s) { s.hidden = s.getAttribute("data-side") !== layer; });
    watch(layer);
  }

  function watch(layer) {
    if (!("IntersectionObserver" in window)) return;
    if (observer) observer.disconnect();
    var links = {};
    document.querySelectorAll('[data-side="' + layer + '"] a').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].classList.toggle("active", id === e.target.id); });
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    document.querySelectorAll('[data-panel="' + layer + '"] .group').forEach(function (g) { observer.observe(g); });
  }

  function initial() {
    var h = location.hash.slice(1);
    if (layers.indexOf(h) >= 0) return h;
    for (var i = 0; i < layers.length; i++) {
      var p = document.querySelector('[data-panel="' + layers[i] + '"]');
      if (p && p.getAttribute("data-count") !== "0") return layers[i];
    }
    return "ref";
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      var layer = t.getAttribute("data-tab");
      history.replaceState(null, "", "#" + layer);
      show(layer);
      window.scrollTo(0, 0);
    });
  });
  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (layers.indexOf(h) >= 0) show(h);
  });

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("[data-goto]");
    if (!link) return;
    var target = document.getElementById(link.getAttribute("data-goto"));
    if (!target) return;
    e.preventDefault();
    var panel = target.closest("[data-panel]");
    if (panel) {
      var layer = panel.getAttribute("data-panel");
      history.replaceState(null, "", "#" + layer);
      show(layer);
    }
    target.scrollIntoView({ block: "center" });
    target.classList.remove("flash");
    void target.offsetWidth;
    target.classList.add("flash");
  });

  var select = document.getElementById("theme");
  var themed = null;
  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme); else root.removeAttribute("data-theme");
    if (!themed) {
      themed = Array.prototype.map.call(document.querySelectorAll("[data-values]"), function (el) {
        return { el: el, base: el.textContent, values: JSON.parse(el.getAttribute("data-values")) };
      });
    }
    themed.forEach(function (t) {
      var overridden = Boolean(theme) && t.values[theme] !== undefined;
      t.el.textContent = overridden ? t.values[theme] : t.base;
      t.el.parentNode.classList.toggle("overridden", overridden);
    });
  }
  if (select) select.addEventListener("change", function () { applyTheme(select.value); });

  show(initial());
})();
`;

export function renderHtml(model: DocsModel, ctx: GeneratorContext): string {
  const hasThemes = model.themes.length > 0;
  const title = escapeHtml(model.title);

  const themePicker = hasThemes
    ? `<label class="picker">Theme
      <select id="theme" aria-label="Theme">
        <option value="">Default</option>
        ${model.themes.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("")}
      </select>
    </label>`
    : "";

  const tabs = model.layers
    .map(
      ({ layer, groups }) =>
        `<button type="button" role="tab" data-tab="${layer}" aria-selected="false">${LAYER_TITLES[layer]}<span class="n">${groups.reduce((sum, g) => sum + g.tokens.length, 0)}</span></button>`,
    )
    .join("");

  const sides = model.layers
    .map(
      ({ layer, groups }) =>
        `<nav data-side="${layer}" aria-label="${LAYER_TITLES[layer]} groups">${groups
          .map((g) => `<a href="#${escapeHtml(groupId(layer, g.path))}">${escapeHtml(g.label)}</a>`)
          .join("")}</nav>`,
    )
    .join("\n");

  const panels = model.layers
    .map(({ layer, groups }) => {
      const total = groups.reduce((sum, g) => sum + g.tokens.length, 0);
      const content =
        groups.length === 0
          ? `<p class="empty">No ${LAYER_TITLES[layer].toLowerCase()} tokens defined.</p>`
          : groups.map((g) => groupHtml(layer, g)).join("\n");
      return `<div data-panel="${layer}" data-count="${total}" role="tabpanel">
  <h2 class="title">${LAYER_TITLES[layer]}</h2>
  <p class="sub">${total} token${total === 1 ? "" : "s"}</p>
  ${content}
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>${STYLES}</style>
<style>
${tokenCss(ctx)}
</style>
</head>
<body>
<header class="bar">
  <h1>${title}</h1>
  ${themePicker}
</header>
<div class="tabs"><div class="seg" role="tablist" aria-label="Token layers">${tabs}</div></div>
<div class="layout">
  <aside class="side">
${sides}
  </aside>
  <main>
${panels}
  </main>
</div>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
