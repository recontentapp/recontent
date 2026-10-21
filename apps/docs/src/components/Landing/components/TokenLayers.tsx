import { Link } from "vocs";
import { ButtonIcon, PaletteIcon, TagIcon, Underline } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";

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

/** Layers: follow one token through the chain. */
export function TokenLayers() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Change what a token{" "}
        <span className="lp-underlined">
          means
          <Underline color="#2563eb" />
        </span>{" "}
        in one place.
      </h2>
      <p className="lp-sub">
        Components read meaning, meaning reads values. Aliases stay aliases all the way into the
        output, so re-pointing <code>system.color.accent</code> moves every button with it.
      </p>
      <p className="lp-more">
        <Link to="/guides/defining-tokens" className="lp-link">
          Defining tokens
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
    </section>
  );
}
