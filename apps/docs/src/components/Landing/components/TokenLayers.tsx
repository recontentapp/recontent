import { Link } from "vocs";
import { ButtonIcon, PaletteIcon, TagIcon, Underline } from "../doodles.tsx";
import { CodePanel, lines, type Line } from "./CodePanel.tsx";

const chain = [
  {
    layer: "Reference",
    fn: "defineReferenceTokens",
    token: "ref.color.blue[9]",
    value: "#2563eb",
    holds: "Raw values. The vocabulary.",
    icon: <PaletteIcon />,
    tone: "coral",
  },
  {
    layer: "System",
    fn: "defineSystemTokens",
    token: "system.color.accent",
    value: "→ ref.color.blue[9]",
    holds: "Meaning. What a value is for.",
    icon: <TagIcon />,
    tone: "yellow",
  },
  {
    layer: "Components",
    fn: "defineComponentTokens",
    token: "button.background",
    value: "→ system.color.accent",
    holds: "Decisions that belong to one component.",
    icon: <ButtonIcon />,
    tone: "blue",
  },
];

const chainCss = lines(`:root {
  --ref-color-blue-9: #2563eb;
  --system-color-accent: var(--ref-color-blue-9);
  --button-background: var(--system-color-accent);
}`);

const themesCode = lines(`const blue = tokens.generateColorScale({ base: "#2563eb" });

const dark = defineTheme(system, {
  color: { background: ref.color.neutral[12], accent: blue[7] },
});

const compact = defineTheme(system, {
  spacing: { md: tokens.dimension(12, "px") },
});

export default defineConfig({
  tokens: { ref, system },
  themes: { mode: { dark }, density: { compact } },
});`);

// Errors are real TypeScript diagnostics from recontent, shortened to their first line.
// A rename in the system layer is caught in every component still using the old name.
const renameLines: Line[] = [
  { code: "const system = defineSystemTokens({" },
  { code: "  color: { primary: ref.color.blue[9] }, // was: accent" },
  { code: "});" },
  { code: "" },
  { code: "const components = defineComponentTokens({" },
  { code: "  button: { background: system.color.accent },", squiggle: "accent" },
  { code: "  link: { color: system.color.accent },", squiggle: "accent" },
  { code: "});" },
];

/** Layers: follow one token through the chain, compose themes, then rename a token. */
export function TokenLayers() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Tokens that{" "}
        <span className="lp-underlined">
          type-check.
          <Underline color="#2563eb" />
        </span>{" "}
        Themes that follow.
      </h2>
      <p className="lp-sub">
        Components read meaning, meaning reads values. Aliases stay aliases all the way into the
        output, so re-pointing <code>system.color.accent</code> moves every button with it. Themes
        override values without touching component code.
      </p>
      <p className="lp-more">
        <Link to="/guides/defining-tokens" className="lp-link">
          Defining tokens
        </Link>{" "}
        ·{" "}
        <Link to="/guides/working-with-themes" className="lp-link">
          Working with themes
        </Link>
      </p>
      <ol className="lp-layers">
        {chain.map((step) => (
          <li key={step.layer} className={`lp-layer lp-tone-${step.tone}`}>
            <div className="lp-layer-icon">{step.icon}</div>
            <h3 className="lp-h3">{step.layer}</h3>
            <p className="lp-layer-fn">
              <code>{step.fn}</code>
            </p>
            <p>{step.holds}</p>
            <p className="lp-layer-example">
              <code>
                {step.token} {step.value}
              </code>
            </p>
          </li>
        ))}
      </ol>
      <div className="lp-chain-out">
        <CodePanel title="generated tokens.css" code={chainCss} language="css" />
        <p>
          <strong>Aliases survive the build.</strong> Each layer emits a CSS variable that points at
          the one below it, so the generated stylesheet reads like your config.
        </p>
      </div>
      <div className="lp-chain-out">
        <CodePanel title="themes.ts" code={themesCode} tone="blue" />
        <p>
          <strong>Color scales &amp; orthogonal theme axes.</strong> Generate full OKLCH ramps from
          one base color and combine independent axes like mode, density, or brand—never touching
          component code.
        </p>
      </div>
      <div className="lp-chain-out">
        <CodePanel
          title="recontent.config.ts"
          code={renameLines}
          error="Property 'accent' does not exist on type '{ primary: … }'. (2 errors)"
          tone="coral"
        />
        <p>
          <strong>Renames fail at compile time.</strong> Every component still referencing the old
          name fails in your editor and during <code>recontent build</code>, not in production.
        </p>
      </div>
    </section>
  );
}
