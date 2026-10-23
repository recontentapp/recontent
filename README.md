<p align="left">
  <img src="https://github.com/recontentapp/recontent/blob/master/.github/logo.png?raw=true" alt="Recontent" width="240" />
</p>

**Design tokens that type-check**

Recontent stores all your design decisions in typed layers<br/>so that your design tokens are enforced by a tool, not by convention.

- **Three layers, one source of truth:** Raw values, meaning & component decisions with aliases that survive the build
- **Themes without rewrites:** Dark mode, density or a rebrand override values, never component code
- **Built-in plugins & an API to extend them:** CSS modules, DTCG export, docs, Tailwind v4, StyleX, TypeScript & more

## Getting started

1. Install & scaffold `recontent.config.ts`

```bash
npm install --save-dev recontent

# Scaffolds `recontent.config.ts` from a preset
npx recontent init neutral

# Starts from DTCG tokens
npx recontent init --from <path>
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

4. Consume them

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
- [Catching breaking changes](https://recontent.app/guides/diffs)

## Contributing

Bug reports, ideas and pull requests are welcome. Read
[CONTRIBUTING.md](https://github.com/recontentapp/recontent/blob/master/CONTRIBUTING.md) to get the
repository running locally.

<p align="left">
  <img src="https://github.com/recontentapp/recontent/blob/master/.github/avatar.png?raw=true" alt="Recontent" width="120" />
</p>
