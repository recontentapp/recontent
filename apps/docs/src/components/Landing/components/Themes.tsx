import { Link } from "vocs";
import { CodePanel, lines } from "./CodePanel.tsx";

const themeConfig = lines(`// Dark mode: same meaning, new value.
const dark = defineTheme(system, {
  color: { surface: tokens.color("#18181b") },
});

// A rebrand: change the vocabulary,
// and every alias follows.
const ocean = defineTheme(ref, {
  color: { blue: tokens.generateColorScale({ base: "#0e7490" }) },
});`);

const themeCss = lines(`.dark {
  --system-color-surface: #18181b;
}

.ocean {
  --ref-color-blue-9: #0e7490;
  /* …the other 11 steps */
}`);

/** Themes, where layers and types pay off together. */
export function Themes() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        Repaint everything. <span className="lp-hl">Rewrite nothing.</span>
      </h2>
      <p className="lp-sub">
        Dark mode swaps a few <code>system</code> colors. A rebrand swaps the <code>ref</code>{" "}
        palette. Every alias follows, your components stay untouched, and the CSS ships only what
        changed.
      </p>
      <p className="lp-more">
        <Link to="/guides/working-with-themes" className="lp-link">
          Working with themes
        </Link>
      </p>
      <div className="lp-pair">
        <CodePanel title="recontent.config.ts" code={themeConfig} />
        <CodePanel title="generated tokens.css" code={themeCss} language="css" tone="green" />
      </div>
    </section>
  );
}
