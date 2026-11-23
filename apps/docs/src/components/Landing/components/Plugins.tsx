import { Link } from "vocs";
import { Underline } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";

// Built-in plugins next to a custom one: same interface, called the same way.
const pluginsConfig = lines(`export default defineConfig({
  tokens: { ref, system },
  introspection: { entry: "src/components/index.ts", importPath: "@acme/ds" },
  plugins: [
    css({ outDir: "src/styles" }),
    tailwind({ outDir: "src/styles", theme: { color: system.color } }),
    dtcg({ outDir: "design" }),
    docs({ outDir: "public/design" }),
    designMD({ outDir: "." }),
    inspect({ outDir: "dist" }),
    contrast({ pairs: [[system.color.text, system.color.surface]] }),
    swift({ outDir: "ios/Tokens" }), // your own
  ],
});

// A plugin reads the resolved tokens and returns files.
const swift = (options: { outDir: string }): RecontentPlugin => ({
  name: "acme:swift",
  generate: ({ registry }) => [
    { path: \`\${options.outDir}/Tokens.swift\`, content: toSwift(registry) },
  ],
});`);

type Output = { label: string; fn?: string; to: string; text: string };

const outputs: Output[] = [
  {
    label: "CSS variables",
    fn: "css()",
    to: "/plugins/css",
    text: "Works in any framework or plain CSS, with one block per theme.",
  },
  {
    label: "Tailwind v4",
    fn: "tailwind()",
    to: "/plugins/tailwind",
    text: "Maps utilities like bg-accent and p-4 directly to your tokens.",
  },
  {
    label: "Docs site",
    fn: "docs()",
    to: "/plugins/docs",
    text: "Builds a searchable static site with theme switching and embedded stories.",
  },
  {
    label: "DESIGN.md",
    fn: "designMD()",
    to: "/plugins/design-md",
    text: "Emits tokens and guidance that coding agents load up front.",
  },
];

/** Plugins: config on the left, featured plugin cards with link to docs on the right. */
export function Plugins() {
  return (
    <section className="lp-section lp-wrap">
      <h2 className="lp-h2">
        One config.{" "}
        <span className="lp-underlined">
          Every output.
          <Underline color="#2db87c" />
        </span>
      </h2>
      <p className="lp-sub">
        Add built-in plugins in your config—or write your own—to ship tokens and components to
        stylesheets, Figma, docs sites, coding agents, native apps, and CI.
      </p>
      <p className="lp-more">
        <Link to="/plugin-api" className="lp-link">
          Writing a plugin
        </Link>
      </p>
      <div className="lp-plugins-split">
        <div className="lp-plugins-left">
          <CodePanel title="recontent.config.ts" code={pluginsConfig} tone="blue" />
        </div>
        <div className="lp-plugins-right">
          <ul className="lp-cards lp-cards-2">
            {outputs.map((output) => (
              <li key={output.label}>
                <Link to={output.to} className="lp-output">
                  <strong>{output.label}</strong>
                  {output.fn ? <code>{output.fn}</code> : null}
                  <span>{output.text}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="lp-plugins-toggle">
            <Link to="/guides/using-plugins" className="lp-btn">
              Show more
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
