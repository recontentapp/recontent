<p align="left">
  <img src="https://github.com/recontentapp/recontent/blob/master/.github/logo.png?raw=true" alt="Recontent" width="240" />
</p>

**A design system your agents can read**

Recontent turns your tokens and components into a design system that people, agents and CI can read.

- **Tokens:** Typed layers and themes, with aliases that survive the build. Dark mode, density or a rebrand override values, never component code
- **Components:** Introspected from your own TypeScript and documented with JSDoc where they live
- **Agents:** `recontent inspect` gives exact props, tokens and usage notes so agents stop guessing, `DESIGN.md` is loaded up front, and `--from` works for apps that install your design system from npm
- **Guardrails:** `recontent diff` catches breaking token and prop changes, and `build --check` keeps generated files honest

Built-in plugins & an API to extend them: CSS variables, Tailwind v4, StyleX, vanilla-extract, TypeScript, DTCG, docs & more.

## Getting started

1. Install & scaffold `recontent.config.ts`

```bash
npm install --save-dev recontent

# Scaffolds `recontent.config.ts` from a preset
npx recontent init neutral

# Starts from DTCG tokens
npx recontent init --dtcg <path>
```

2. Define your design tokens

```ts
import {
  defineConfig,
  defineReferenceTokens,
  defineSystemTokens,
  defineTheme,
  tokens,
} from "recontent";
import { css } from "recontent/plugins";

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

// Same meaning, different values
const dark = defineTheme(system, {
  color: {
    background: tokens.color("#18181b"),
    text: tokens.color("#fafafa"),
  },
});

export default defineConfig({
  tokens: { ref, system, components },
  themes: { dark },
  plugins: [css({ outDir: "src/generated" })],
});
```

3. Build your outputs

```bash
npx recontent build   # add --watch to rebuild on save
```

4. Introspect your components

Add `introspection: { entry: "src/components/index.ts", importPath: "@acme/ds" }` to `defineConfig`, then:

```bash
npx recontent inspect                    # counts, themes and component names
npx recontent inspect components Button  # its exact props, defaults and usage notes
```

5. Consume the tokens

```css
@import "./generated/tokens.css";

body {
  background: var(--system-color-background);
  color: var(--system-color-foreground);
}
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
