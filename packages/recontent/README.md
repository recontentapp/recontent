# Recontent

Define design tokens once, in TypeScript. Generate CSS, Tailwind, vanilla-extract, StyleX, TypeScript
and DTCG from them.

Recontent is a command line tool, so it runs the same way from your terminal, from an agent or from
CI.

## Quick start

```bash
npm install --save-dev recontent
npx recontent init neutral   # or: material, or --from <dtcg path>
```

Add an output to the generated `recontent.config.ts`:

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

```bash
npx recontent build          # add --watch to rebuild on save
npx recontent diff main --fail-on-breaking   # catch removed or renamed tokens in CI
```

## Commands

| Command                   | Description                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `recontent init [preset]` | Scaffold a config from a preset, or from DTCG files with `--from` |
| `recontent build`         | Run the configured plugins and write their output                 |
| `recontent diff [rev]`    | Compare the tokens against a previous git revision                |

## Built-in plugins

`css`, `tailwind`, `vanillaExtract` (with an optional registry of React components), `stylex`,
`typescript`, `typescriptNative`, `dtcg` and `docs`, all from `recontent/plugins`. Write your own
with the `RecontentPlugin` interface.

The documentation source lives in
[`apps/docs`](https://github.com/recontentapp/recontentapp/tree/master/apps/docs).
