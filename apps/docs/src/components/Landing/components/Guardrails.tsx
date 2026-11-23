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

/** CI guardrails: diff, WCAG contrast checks, and stale-output verification. */
export function Guardrails() {
  return (
    <section className="lp-band">
      <div className="lp-wrap">
        <h2 className="lp-h2">
          Break a token, prop, or contrast. <span className="lp-hl">CI catches</span> it.
        </h2>
        <p className="lp-sub">
          <code>recontent diff</code> compares tokens and components against any git revision,{" "}
          <code>contrast()</code> enforces WCAG ratios across every theme, and{" "}
          <code>recontent build --check</code> fails when generated files go stale.
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
