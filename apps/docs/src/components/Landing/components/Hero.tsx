import { Link } from "vocs";
import { BuddyPeekArt, MarkerCircle } from "../doodles.tsx";
import { CodePanel, type Line } from "./CodePanel.tsx";
import { Install } from "./Install.tsx";

// Errors below are real TypeScript diagnostics from recontent, shortened to their first line.
// The hero shows a rename in the system layer, caught in every component still using the old name.
const heroLines: Line[] = [
  { code: "const system = defineSystemTokens({" },
  { code: "  color: { primary: ref.color.blue[9] }, // was: accent" },
  { code: "});" },
  { code: "" },
  { code: "const components = defineComponentTokens({" },
  { code: "  button: { background: system.color.accent },", squiggle: "accent" },
  { code: "  link: { color: system.color.accent },", squiggle: "accent" },
  { code: "});" },
];

/** The claim, and an editor moment that proves it. */
export function Hero() {
  return (
    <section className="lp-hero lp-wrap">
      <div className="lp-hero-copy">
        <h1 className="lp-h1">
          Design tokens that{" "}
          <span className="lp-circled">
            type-check.
            <MarkerCircle />
          </span>
        </h1>
        <p className="lp-lede">
          Recontent stores all your design decisions in typed layers so that your design tokens are
          enforced by a tool, not by convention.
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
            <CodePanel
              title="recontent.config.ts"
              code={heroLines}
              error="Property 'accent' does not exist on type '{ primary: … }'. (2 errors)"
              tone="coral"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
