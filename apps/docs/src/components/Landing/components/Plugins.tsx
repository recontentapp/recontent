import { Link } from "vocs";
import { Underline } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";

// Built-in plugins next to a custom one: same interface, called the same way.
const pluginsConfig = lines(`export default defineConfig({
  tokens: { ref, system, components },
  plugins: [
    css({ outDir: "src/styles" }),
    tailwind({ outDir: "src/styles", theme: { color: system.color } }),
    typescript({ outDir: "src/charts" }),
    typescriptNative({ outDir: "mobile/theme" }),
    dtcg({ outDir: "design" }),
    docs({ outDir: "public/tokens" }),
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

const builtInPlugins = [
  {
    label: "CSS variables",
    fn: "css()",
    to: "/plugins/css",
    text: "Any framework, or none. One block per theme.",
  },
  {
    label: "Tailwind v4",
    fn: "tailwind()",
    to: "/plugins/tailwind",
    text: "Utilities like bg-accent and p-4 resolve to your tokens.",
  },
  {
    label: "StyleX",
    fn: "stylex()",
    to: "/plugins/stylex",
    text: "Typed defineVars, plus a createTheme per theme.",
  },
  {
    label: "DTCG",
    fn: "dtcg()",
    to: "/plugins/dtcg",
    text: "JSON for Figma through Tokens Studio, or another pipeline.",
  },
  {
    label: "Docs",
    fn: "docs()",
    to: "/plugins/docs",
    text: "An HTML and Markdown catalogue for your team and agents.",
  },
  {
    label: "& more",
    to: "/guides/using-plugins",
    text: "TypeScript, React Native, vanilla-extract, or your own.",
  },
];

/** Plugins: every output, built-in or your own, goes through one API. */
export function Plugins() {
  return (
    <section className="lp-section lp-wrap lp-centered">
      <h2 className="lp-h2">
        One config.{" "}
        <span className="lp-underlined">
          Every output.
          <Underline color="#2db87c" />
        </span>
      </h2>
      <p className="lp-sub">
        Everything is a plugin that can be added in your config so that your design tokens can go
        wherever you need them: stylesheets, Figma, docs, native apps & more.
      </p>
      <ul className="lp-plugins">
        {builtInPlugins.map((plugin) => (
          <li key={plugin.label}>
            <Link to={plugin.to} className="lp-output">
              <strong>{plugin.label}</strong>
              {plugin.fn ? <code>{plugin.fn}</code> : null}
              <span>{plugin.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="lp-plugins-config">
        <CodePanel title="recontent.config.ts" code={pluginsConfig} tone="blue" />
      </div>
    </section>
  );
}
