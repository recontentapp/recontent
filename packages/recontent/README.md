<p align="left">
  <img src="https://github.com/recontentapp/recontent/blob/master/.github/logo.png?raw=true" alt="Recontent" width="240" />
</p>

**Design system toolchain for humans & agents**

Recontent types your design tokens, introspects your React components and serves both, from one CLI, to your team, your coding agents and your CI.

- **Tokens:** Typed layers and themes, with aliases that survive the build. Dark mode, density or a rebrand override values, never component code
- **Components:** Introspected from your own TypeScript and documented with JSDoc where they live
- **Agents:** `recontent inspect` gives exact props, tokens and usage notes so agents stop guessing, `DESIGN.md` is loaded up front, and `--from` works for apps that install your design system from npm
- **Guardrails:** `recontent diff` catches breaking token and prop changes, and `build --check` keeps generated files honest

Built-in plugins & an API to extend them: CSS variables, Tailwind v4, StyleX, vanilla-extract, TypeScript, DTCG, docs & more.

## Getting started

### 1. Install & initialize

```bash
npm install --save-dev recontent

# Interactive setup: scaffolds recontent.config.ts and configures coding agents
npx recontent init
```

### 2. Configure tokens, components & guardrails

Define your tokens, point Recontent at your component entry, and add plugins in `recontent.config.ts` (tokens are optional if you only introspect components):

```ts
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { contrast, css, designMD } from "recontent/plugins";

// Raw values: the vocabulary
const ref = defineReferenceTokens({
  color: {
    blue: tokens.generateColorScale({ base: "#2563eb" }),
    gray: tokens.colorScale({ 50: "#fafafa", 900: "#18181b" }),
  },
});

// Meaning: what a value is for
const system = defineSystemTokens({
  color: {
    background: ref.color.gray[50],
    text: ref.color.gray[900],
    accent: ref.color.blue[9],
  },
});

// Same meaning, pointing at different values
const dark = defineTheme(system, {
  color: {
    background: ref.color.gray[900],
    text: ref.color.gray[50],
  },
});

export default defineConfig({
  tokens: { ref, system },
  themes: { dark },
  introspection: { entry: "src/components/index.ts", importPath: "@acme/ds" },
  plugins: [
    css({ outDir: "src/generated" }),
    designMD({ outDir: "." }),
    contrast({
      rules: [{ foreground: "system.color.text", background: "system.color.background" }],
    }),
  ],
});
```

### 3. Build & consume outputs

```bash
npx recontent build   # validates aliases & contrast, emits CSS variables & DESIGN.md (add --watch in dev)
```

```css
@import "./generated/tokens.css";

body {
  background: var(--system-color-background);
  color: var(--system-color-text);
}
```

### 4. Inspect & connect coding agents

Query exact tokens, component props, defaults, JSDoc usage notes, and referenced types on demand:

```bash
npx recontent inspect                    # overview: themes, token layers & components
npx recontent inspect components Button  # exact props, defaults & usage notes
npx recontent inspect tokens system      # values, CSS variables & theme overrides
npx recontent inspect search accent      # search across tokens, components & types
```

`DESIGN.md` gives agents an up-front summary, and `recontent init --skill --agents-md` (or `--mcp cursor` for MCP hosts) configures the agent loop. Apps that install your published design system can query it with `--from @acme/ds`.

### 5. Enforce guardrails in CI

Catch stale generated files and breaking token, theme, or component prop changes before merging:

```bash
npx recontent build --check                          # fails if any generated file is missing or stale
npx recontent diff origin/main --fail-on-breaking    # fails on breaking token, theme, prop or type changes
```

## Documentation

Read the full documentation at [recontent.app](https://recontent.app).
Good places to start:

- [Defining tokens](https://recontent.app/guides/defining-tokens)
- [Using plugins](https://recontent.app/guides/using-plugins)
- [Working with themes](https://recontent.app/guides/working-with-themes)
- [Introspecting components](https://recontent.app/guides/introspecting-components)
- [Coding with agents](https://recontent.app/guides/agents)
- [Catching breaking changes](https://recontent.app/guides/diffs)

## Contributing

Bug reports, ideas and pull requests are welcome. Read
[CONTRIBUTING.md](https://github.com/recontentapp/recontent/blob/master/CONTRIBUTING.md) to get the
repository running locally.

<p align="left">
  <img src="https://github.com/recontentapp/recontent/blob/master/.github/avatar.png?raw=true" alt="Recontent" width="120" />
</p>
