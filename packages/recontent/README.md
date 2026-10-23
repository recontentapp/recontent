<p align="center">
  <img src="https://raw.githubusercontent.com/recontentapp/recontent/master/.github/logo.png" alt="Recontent" width="360" />
</p>

<p align="center">
  <strong>Design tokens that type-check.</strong><br />
  Define them once in TypeScript. Generate CSS, Tailwind, vanilla-extract, StyleX, TypeScript and DTCG.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/recontent"><img src="https://img.shields.io/npm/v/recontent" alt="npm version" /></a>
  <a href="https://github.com/recontentapp/recontent/actions/workflows/ci.yml"><img src="https://github.com/recontentapp/recontent/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/recontentapp/recontent/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/recontent" alt="MIT license" /></a>
</p>

---

A design system's decisions end up copied everywhere: a CSS file, a Tailwind config, a constants
module, a Figma library. Every copy drifts, and nothing tells you which rename will break a
consumer.

Recontent keeps those decisions in one typed file, `recontent.config.ts`, and treats everything
else as generated output.

- **Typed from end to end.** A missing scale step, a theme override for a token that doesn't
  exist or an alias to the wrong type fails in your editor, not in production.
- **Three layers, one source of truth.** Raw values (`ref`), meaning (`system`) and component
  decisions (`components`), with aliases that survive the build.
- **Themes without rewrites.** Dark mode, density or a rebrand override values, never component
  code.
- **Every output you need.** Plugins for CSS, Tailwind v4, vanilla-extract, StyleX, TypeScript,
  React Native, DTCG and a browsable docs catalogue. Or write your own.
- **Breaking changes caught in review.** `recontent diff` fails a pull request that removes or
  renames a token.
- **Built for humans, agents and CI.** Plain text on stdout and stderr, meaningful exit codes.

## Quick start

```bash
npm install --save-dev recontent
npx recontent init neutral
```

`init` scaffolds a `recontent.config.ts` from a preset: `neutral` (shadcn/ui's neutral base) or
`material` (the Material 3 baseline). Already have DTCG tokens? Use `recontent init --from <path>`.

Add an output:

```ts
import { defineConfig } from "recontent";
import { css } from "recontent/plugins";

// ref, system, components and dark come from the preset

export default defineConfig({
  tokens: { ref, system, components },
  themes: { dark },
  plugins: [css({ outDir: "src/generated" })],
});
```

Build it:

```bash
npx recontent build   # add --watch to rebuild on save
```

```css
@import "./generated/tokens.css";

body {
  background: var(--system-color-background);
  color: var(--system-color-foreground);
}
```

## Tokens in layers

```ts
import { defineReferenceTokens, defineSystemTokens, defineTheme, tokens } from "recontent";

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
```

Code consumes `system` and component tokens. Aliases stay aliases in the output (`var()`
references in CSS), so a theme override flows through everywhere it is used.

## Plugins

| Plugin               | Generates                                                    |
| -------------------- | ------------------------------------------------------------ |
| `css()`              | CSS custom properties, one block per theme                   |
| `tailwind()`         | A Tailwind CSS v4 theme, so `bg-accent` resolves to a token  |
| `vanillaExtract()`   | Typed vanilla-extract theme contracts                        |
| `stylex()`           | StyleX variables and themes                                  |
| `typescript()`       | Typed token constants for web code, charts and SSR           |
| `typescriptNative()` | Typed token constants for React Native and Expo              |
| `dtcg()`             | DTCG JSON for Figma, Tokens Studio and other tools           |
| `docs()`             | An HTML and Markdown token catalogue for your team or agents |

All exported from `recontent/plugins`. A plugin is a plain object with a few lifecycle hooks, so
adding your own output (Swift, Kotlin, a contrast linter) takes a function. See the
[Plugin API](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/plugin-api.mdx).

## CLI

| Command                   | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `recontent init [preset]` | Scaffold a config from a preset, or from DTCG files with `--from` |
| `recontent build`         | Run the configured plugins and write their output                 |
| `recontent diff [rev]`    | Compare the tokens against a previous git revision                |

Guard your tokens in CI:

```bash
npx recontent diff origin/master --fail-on-breaking
```

```md
## Breaking (1)

- **renamed** `system.color.bg` -> `system.color.background` (color, alias -> ref.color.gray.50)
```

## Documentation

The documentation lives in [`apps/docs`](https://github.com/recontentapp/recontent/tree/master/apps/docs).
Good places to start:

- [Why Recontent](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/introduction/why-recontent.mdx)
- [Getting started](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/introduction/getting-started.mdx)
- [Defining tokens](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/guides/defining-tokens.mdx)
- [Working with themes](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/guides/working-with-themes.mdx)
- [Catching breaking changes](https://github.com/recontentapp/recontent/blob/master/apps/docs/src/pages/guides/diffs.mdx)

## Contributing

<img src="https://raw.githubusercontent.com/recontentapp/recontent/master/.github/avatar.png" alt="" width="96" align="right" />

Bug reports, ideas and pull requests are welcome. Read
[CONTRIBUTING.md](https://github.com/recontentapp/recontent/blob/master/CONTRIBUTING.md) to get the
repository running locally.

## License

[MIT](https://github.com/recontentapp/recontent/blob/master/LICENSE) © Grégoire Mielle
