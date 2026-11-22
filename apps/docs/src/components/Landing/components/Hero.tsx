import { Link } from "vocs";
import { BuddyPeekArt, MarkerCircle } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";
import { CopyAgentPrompt } from "./CopyAgentPrompt.tsx";

// Real output of `recontent inspect components Button`, without the Notes and Required columns.
const heroOutput = lines(`$ recontent inspect components Button

## Button

Triggers an action.

Import: \`import { Button } from "@acme/ds"\`

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
          <span className="lp-h1-line">Design system</span>
          <span className="lp-h1-line">
            <span className="lp-circled">
              toolchain
              <MarkerCircle />
            </span>{" "}
            for
          </span>
          <span className="lp-h1-line">humans & agents</span>
        </h1>
        <p className="lp-lede">
          Define typed tokens, introspect React components, and serve both from one CLI to your
          team, coding agents, and CI.
        </p>
        <div className="lp-ctas">
          <CopyAgentPrompt />
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
