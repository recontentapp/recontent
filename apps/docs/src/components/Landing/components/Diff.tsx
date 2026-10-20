import { Link } from "vocs";
import { CodePanel, lines } from "./CodePanel.tsx";

const diffOutput = lines(`$ recontent diff origin/main --fail-on-breaking

## Breaking (2)

- renamed system.color.bg -> system.color.background
- removed system.color.legacyBlue (color #0000ff)

## Changed (1)

- ref.color.gray.900  #18181b -> #09090b`);

/** Safe changes in CI. */
export function Diff() {
  return (
    <section className="lp-band">
      <div className="lp-wrap">
        <h2 className="lp-h2">
          Rename a token. <span className="lp-hl">CI knows</span> who it breaks.
        </h2>
        <p className="lp-sub">
          <code>recontent diff</code> compares your tokens with any git revision. It tells a rename
          from a removal, and a value change from a breaking one.
        </p>
        <p className="lp-more">
          <Link to="/guides/diffs" className="lp-link">
            Catching breaking changes
          </Link>
        </p>
        <div className="lp-diff">
          <CodePanel code={diffOutput} tone="coral" />
        </div>
      </div>
    </section>
  );
}
