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
        Override the meaning, or the vocabulary. <span className="lp-hl">Nothing else moves.</span>
      </h2>
      <p className="lp-sub">
        A theme replaces only the tokens it names. Override <code>system</code> for dark mode,{" "}
        <code>ref</code> for a rebrand. Component code doesn&apos;t change, and the output only
        contains the difference.
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
