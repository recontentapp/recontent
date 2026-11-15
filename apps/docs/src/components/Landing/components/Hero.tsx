import { Link } from "vocs";
import { BuddyPeekArt, MarkerCircle } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";
import { Install } from "./Install.tsx";

// Real output of `recontent inspect components Button`, without the Notes and Required columns.
const heroOutput = lines(`$ recontent inspect components Button

## Button

Triggers an action.

Source: \`src/components/Button.tsx:21\`

### Usage

Prefer a link when the click only navigates.

| Prop | Type | Default |
| --- | --- | --- |
| \`label\` | \`string\` | — |
| \`loading\` | \`boolean\` | \`false\` |
| \`variant\` | \`"primary" \\| "ghost"\` | \`"primary"\` |

Also accepts: \`ButtonHTMLAttributes\` (288 props from @types/react)`);

/** The claim, and the answer an agent gets. */
export function Hero() {
  return (
    <section className="lp-hero lp-wrap">
      <div className="lp-hero-copy">
        <h1 className="lp-h1">
          A design system your agents can{" "}
          <span className="lp-circled">
            read.
            <MarkerCircle />
          </span>
        </h1>
        <p className="lp-lede">
          Recontent types your design tokens, introspects your React components and serves both,
          from one CLI, to your team, your coding agents and your CI.
        </p>
        <div className="lp-hero-actions">
          <Install />
          <Link to="/introduction/getting-started" className="lp-btn lp-btn-primary">
            Read docs
          </Link>
        </div>
      </div>
      <div className="lp-hero-art">
        <div className="lp-peek">
          <div className="lp-peek-head">
            <BuddyPeekArt />
          </div>
          <div className="lp-peek-panel">
            <CodePanel code={heroOutput} language="sh" tone="coral" />
          </div>
        </div>
      </div>
    </section>
  );
}
