import { Link } from "vocs";
import { CodePanel, lines } from "./CodePanel.tsx";

// Real output of `recontent diff`, in the format the CLI prints.
const diffOutput = lines(`$ recontent diff origin/main --fail-on-breaking

# Tokens

## Breaking (1)

- **renamed** \`system.color.accent\` -> \`system.color.brand\` (color, alias -> ref.color.blue.9)

# Components

## Breaking (1)

- \`Button\`
  - **prop** \`variant\`: removed value \`"ghost"\``);

/** Safe changes in CI. */
export function Diff() {
  return (
    <section className="lp-band">
      <div className="lp-wrap">
        <h2 className="lp-h2">
          Remove a prop. <span className="lp-hl">CI catches</span> it.
        </h2>
        <p className="lp-sub">
          <code>recontent diff</code> compares your tokens and your components with any git
          revision. It flags a removed prop or a prop that lost a value, and tells a renamed token
          from a removed one.
        </p>
        <p className="lp-more">
          <Link to="/guides/diffs" className="lp-link">
            Catching breaking changes
          </Link>
        </p>
        <div className="lp-diff">
          <CodePanel
            code={diffOutput}
            language="sh"
            tone="coral"
            error="2 breaking changes found (exit 1)"
          />
        </div>
      </div>
    </section>
  );
}
