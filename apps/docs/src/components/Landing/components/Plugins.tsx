import { Link } from "vocs";
import { Underline } from "../doodles.tsx";
import { CodePanel, lines } from "./CodePanel.tsx";

// Built-in plugins next to a custom one: same interface, called the same way.
const pluginsConfig = lines(`export default defineConfig({
  tokens: { ref, system },
  introspection: { entry: "src/components/index.ts" },
  plugins: [
    css({ outDir: "src/styles" }),
    tailwind({ outDir: "src/styles", theme: { color: system.color } }),
    dtcg({ outDir: "design" }),
    docs({ outDir: "public/design" }),
    designMD({ outDir: "." }),
    inspect({ outDir: "dist" }),
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

const groups: { title: string; outputs: Output[] }[] = [
  {
    title: "Styling",
    outputs: [
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
        label: "TypeScript",
        fn: "typescript()",
        to: "/plugins/typescript",
        text: "Typed constants for charts, canvas and native code.",
      },
      {
        label: "& more",
        to: "/guides/using-plugins",
        text: "vanilla-extract, React Native, or your own.",
      },
    ],
  },
  {
    title: "Docs & agents",
    outputs: [
      {
        label: "Docs",
        fn: "docs()",
        to: "/plugins/docs",
        text: "A searchable HTML page for your team, with a page per component.",
      },
      {
        label: "DESIGN.md",
        fn: "designMD()",
        to: "/plugins/design-md",
        text: "Tokens and guidance that agents load up front.",
      },
      {
        label: "Snapshot",
        fn: "inspect()",
        to: "/plugins/inspect",
        text: "Ship your design system so apps can browse it with inspect --from.",
      },
    ],
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
        Everything is a plugin that can be added in your config so that your tokens and components
        can go wherever you need them: stylesheets, Figma, docs, agents, native apps & more.
      </p>
      {groups.map((group) => (
        <div key={group.title} className="lp-group">
          <h3 className="lp-h3">{group.title}</h3>
          <ul className="lp-cards">
            {group.outputs.map((output) => (
              <li key={output.label}>
                <Link to={output.to} className="lp-output">
                  <strong>{output.label}</strong>
                  {output.fn ? <code>{output.fn}</code> : null}
                  <span>{output.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="lp-plugins-config">
        <CodePanel title="recontent.config.ts" code={pluginsConfig} tone="blue" />
      </div>
    </section>
  );
}
