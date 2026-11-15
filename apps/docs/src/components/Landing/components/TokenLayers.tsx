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

/** Layers: follow one token through the chain, then rename it. */
export function TokenLayers() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Tokens that{" "}
        <span className="lp-underlined">
          type-check.
          <Underline color="#2563eb" />
        </span>
      </h2>
      <p className="lp-sub">
        Components read meaning, meaning reads values. Aliases stay aliases all the way into the
        output, so re-pointing <code>system.color.accent</code> moves every button with it. Themes
        override values, never component code.
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
          <strong>The chain survives the build.</strong> Each layer becomes a variable that points
          at the one below it, so the output reads like your config.
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
          <strong>Rename a token, and the compiler finds the rest.</strong> Every component still
          using the old name fails in your editor and at <code>recontent build</code>, not in
          production.
        </p>
      </div>
    </section>
  );
}
