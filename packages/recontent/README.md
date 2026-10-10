# Recontent.app

`recontent` is a CLI for design token tooling: define tokens once in a
`recontent.config.ts`, then generate CSS, vanilla-extract, TypeScript, StyleX,
DTCG (`.tokens.json`), Tailwind v4 CSS, or token documentation (HTML and/or Markdown) from it. Every output is a
plugin listed in the config and run by `recontent build`:

```ts
import { css, docs, dtcg } from "recontent/plugins";

export default defineConfig({
  tokens: { ref, system, components },
  plugins: [
    css({ outDir: "dist" }),
    dtcg({ outDir: "tokens" }),
    docs({ outDir: "docs", markdown: true }),
  ],
});
```

`dtcg()` writes `tokens.tokens.json` plus one `<theme>.tokens.json` per theme.

## Docs

`docs()` writes a design-token documentation site: `design.html` is a single
self-contained page with one tab per layer (Reference, System, Components), a
theme switcher, live previews, and visible descriptions and deprecations;
`design.md` is the same content as Markdown tables.

```ts
docs({
  outDir: "docs",
  html: true, // default: write design.html
  markdown: false, // default: write design.md
  title: "Design tokens", // page / document title
});
```

At least one of `html` or `markdown` must be enabled.

## Tailwind

`tailwind()` writes one CSS file (`tailwind.css` by default) to import **after**
`@import "tailwindcss";`. It contains the same `:root` / theme blocks as
`css()`, an `@theme inline` block mapping the tokens you pass into Tailwind
namespaces, and `@custom-variant` rules for your themes. Because the theme is
`inline`, utilities point at the recontent variables, so `.dark` /
`[data-theme]` overrides work at runtime. Nothing is inferred: only the
tokens you pass are mapped.

```ts
tailwind({
  outDir: "src/styles",
  theme: {
    color: system.colors, // --color-accent, --color-text-muted, …
    spacing: system.spacing, // --spacing-sm, …
    radius: system.radius,
    font: { sans: system.fontFamily }, // an object key names a single token
    text: system.typography, // text-<key> + font-<key>, composable with leading-* / tracking-*
    shadow: system.shadow, // shadow-<key>, composable with ring-* and /50
    duration: system.motion, // duration-<key>
    defaults: { font: system.fontFamily.sans }, // --default-font-family
  },
});
```

```css
@import "tailwindcss";
@import "./styles/tailwind.css";
```

Keys come from the object / scale structure, kebab-cased (`textMuted` →
`text-muted`, nested groups join with `-`). A bare token is only allowed for
`spacing` (it emits Tailwind's `--spacing` base unit).

| `theme` option | Tailwind namespace        |
| -------------- | ------------------------- |
| `color`        | `--color-*`               |
| `spacing`      | `--spacing-*`             |
| `radius`       | `--radius-*`              |
| `font`         | `--font-*`                |
| `fontWeight`   | `--font-weight-*`         |
| `text`         | `--text-*`                |
| `tracking`     | `--tracking-*`            |
| `leading`      | `--leading-*`             |
| `ease`         | `--ease-*`                |
| `breakpoint`   | `--breakpoint-*`          |
| `container`    | `--container-*`           |
| `blur`         | `--blur-*`                |
| `perspective`  | `--perspective-*`         |
| `aspect`       | `--aspect-*`              |
| `shadow`       | `--shadow-*`              |
| `insetShadow`  | `--inset-shadow-*`        |
| `dropShadow`   | `--drop-shadow-*`         |
| `textShadow`   | `--text-shadow-*`         |
| `duration`     | `--transition-duration-*` |

`text` accepts font sizes (`dimension`) or whole `typography` tokens. A
typography token emits `--text-<key>` plus its `--line-height`,
`--letter-spacing` and `--font-weight` sub-properties, and a native
`--font-<key>` for its family. Write `text-heading font-heading`: `leading-*`,
`tracking-*`, the `text-heading/7` line-height modifier and `font-*` overrides
(`text-heading font-mono`) all compose, because the family is a regular
`font-*` utility. Set `typographyUtilities: true` to also emit a
`text-<key>` `@utility` that applies the family, at the cost of `font-*`
overrides and the `/7` modifier no longer reaching it.

`shadow` tokens feed Tailwind's composite shadow stack, so `shadow-card ring-2`
renders both. A shadow that no theme overrides (directly or through an alias)
is inlined with its colour as a `var()`, so Tailwind can recolour it:
`shadow-card/50` and `shadow-red-500` work. A shadow a theme overrides stays a
`var()`, because Tailwind cannot parse one: those modifiers have no effect
there and `build` warns. The same applies to `insetShadow`,
`dropShadow` and `textShadow`.

`defaults` takes single tokens for Tailwind's `--default-*` keys: `font`
(`fontFamily`, `--default-font-family`), `monoFont` (`fontFamily`,
`--default-mono-font-family`), `transitionDuration` (`duration`,
`--default-transition-duration`) and `transitionTimingFunction`
(`cubicBezier`, `--default-transition-timing-function`). `resetDefaults`
does not touch them.

Because the theme is `inline`, `--color-*` variables are not emitted at
runtime. In hand-written CSS use `--theme(--color-accent)` or the recontent
variable (`var(--system-colors-accent)`).

Mind Tailwind's own lookups: `--spacing-*` also feeds width, height and `max-w-*` utilities, so spacing keys such as `lg` or `xl` override the container sizes behind `max-w-lg` (use `max-w-[32rem]` or a `container` group instead). `build` warns when a spacing key does this.

Other options: `filename`, `themeSelector` (`"class"` by default) /
`themeAttribute`, `themeVariants` (emit `@custom-variant <theme>` for every
theme, kebab-cased, e.g. `dark:` and `high-contrast:`; `false` or a list of
theme names to narrow; default `true`), and `resetDefaults` (`true` or a list
of namespaces emits `--<ns>-*: initial;` to drop Tailwind's defaults; `"all"`
emits `--*: initial;` to start from an empty theme), `layer` (the
generated `:root` and theme blocks sit in `@layer theme` by default so your own
`@layer base`/`theme` CSS can override a token; give another name, or `false`
to leave them unlayered) and `typographyUtilities` (see above).
A typography `text-<key>` that collides with an emitted `--color-<key>`, and
duplicate keys (including `--font-<key>` from typography vs a `font` key), are
reported as errors by `build`, which also warns when
a theme is named like a built-in Tailwind variant (`print`, `hover`, `open`, …),
since its `@custom-variant` would replace it; `dark` is exempt.

## Commands

```
recontent init <preset>           Scaffold a recontent.config.ts (presets: neutral, material)
recontent init --from <sources>   Generate recontent.config.ts from DTCG tokens
recontent build [-w]              Run configured plugins and write their output
recontent diff [rev]              Compare tokens against a git revision (default HEAD)
                                  --format <markdown|json> (default markdown)
```

### Importing DTCG tokens

`recontent init --from <sources...>` writes a working `recontent.config.ts`
from tokens you already keep as [DTCG](https://www.designtokens.org/) JSON.
`<sources>` is either one DTCG 2025.10 resolver file (`*.resolver.json`), or
any number of `*.tokens.json` files and directories (a directory contributes its
`*.tokens.json` files, sorted), merged in the order given. `--force` and
`-c/--config` work as for plain `init`. It prints how many tokens were
imported and one warning per token it had to skip.

```
recontent init --from tokens.resolver.json
recontent init --from tokens/core.tokens.json tokens/semantic.tokens.json
```

How tokens are mapped:

- A token with a literal value goes to `ref`. A token with an alias anywhere in
  its value (including inside a composite such as a typography `fontFamily`)
  goes to `system`. Both keep their DTCG path.
- Alias chains collapse: `{a}` → `{b}` → literal becomes a reference to the
  final `ref` token. An alias to a composite that itself has aliases is
  inlined, with its members pointing at `ref`.
- `$type` is inherited from groups; when it is missing it is inferred from the
  value (or from the alias target). `$root` becomes a child named `root`.
  `$description` and `$deprecated` are kept.
- In a resolver, every modifier's default context (its `default`, else a
  context named `default`, else the first one, with a warning) is merged into
  the base tokens, and every other context becomes a theme, named after the
  context (`dark`) or, when there are several modifiers, `<modifier>-<context>`
  (`theme-dark`). Sets that are not in `resolutionOrder` are ignored.
  Token files given directly produce no themes.

Limitations:

- A theme only lists the tokens whose definition differs from the base. Its
  overrides are resolved to literal values (`defineTheme` keeps no aliases), and
  tokens that reach an overridden `system` token through a collapsed alias chain
  get an override too. A context path that is missing from the base, or has a
  different type, is skipped with a warning.
- Dropped silently: `$extensions`. Skipped with a warning: types recontent has no
  equivalent for (`string`, `custom-*`), dimensions in units other than
  `px`/`rem`/`em`, colors that are out of range or in an unknown color space,
  JSON-pointer `$ref`s inside values, `$extends`, and aliases to missing or skipped
  tokens. Unknown typography properties (such as `WebkitFontSmoothing`) are dropped.
- Names recontent rejects (containing `.`, `{` or `}`, starting with `# Recontent.app

`recontent` is a CLI for design token tooling: define tokens once in a
`recontent.config.ts`, then generate CSS, vanilla-extract, TypeScript, StyleX,
DTCG (`.tokens.json`), Tailwind v4 CSS, or token documentation (HTML and/or Markdown) from it. Every output is a
plugin listed in the config and run by `recontent build`:

```ts
import { css, docs, dtcg } from "recontent/plugins";

export default defineConfig({
  tokens: { ref, system, components },
  plugins: [
    css({ outDir: "dist" }),
    dtcg({ outDir: "tokens" }),
    docs({ outDir: "docs", markdown: true }),
  ],
});
```

`dtcg()` writes `tokens.tokens.json` plus one `<theme>.tokens.json` per theme.

## Docs

`docs()` writes a design-token documentation site: `design.html` is a single
self-contained page with one tab per layer (Reference, System, Components), a
theme switcher, live previews, and visible descriptions and deprecations;
`design.md` is the same content as Markdown tables.

```ts
docs({
  outDir: "docs",
  html: true, // default: write design.html
  markdown: false, // default: write design.md
  title: "Design tokens", // page / document title
});
```

At least one of `html` or `markdown` must be enabled.

## Tailwind

`tailwind()` writes one CSS file (`tailwind.css` by default) to import **after**
`@import "tailwindcss";`. It contains the same `:root` / theme blocks as
`css()`, an `@theme inline` block mapping the tokens you pass into Tailwind
namespaces, and `@custom-variant` rules for your themes. Because the theme is
`inline`, utilities point at the recontent variables, so `.dark` /
`[data-theme]` overrides work at runtime. Nothing is inferred: only the
tokens you pass are mapped.

```ts
tailwind({
  outDir: "src/styles",
  theme: {
    color: system.colors, // --color-accent, --color-text-muted, …
    spacing: system.spacing, // --spacing-sm, …
    radius: system.radius,
    font: { sans: system.fontFamily }, // an object key names a single token
    text: system.typography, // text-<key> + font-<key>, composable with leading-* / tracking-*
    shadow: system.shadow, // shadow-<key>, composable with ring-* and /50
    duration: system.motion, // duration-<key>
    defaults: { font: system.fontFamily.sans }, // --default-font-family
  },
});
```

```css
@import "tailwindcss";
@import "./styles/tailwind.css";
```

Keys come from the object / scale structure, kebab-cased (`textMuted` →
`text-muted`, nested groups join with `-`). A bare token is only allowed for
`spacing` (it emits Tailwind's `--spacing` base unit).

| `theme` option | Tailwind namespace        |
| -------------- | ------------------------- |
| `color`        | `--color-*`               |
| `spacing`      | `--spacing-*`             |
| `radius`       | `--radius-*`              |
| `font`         | `--font-*`                |
| `fontWeight`   | `--font-weight-*`         |
| `text`         | `--text-*`                |
| `tracking`     | `--tracking-*`            |
| `leading`      | `--leading-*`             |
| `ease`         | `--ease-*`                |
| `breakpoint`   | `--breakpoint-*`          |
| `container`    | `--container-*`           |
| `blur`         | `--blur-*`                |
| `perspective`  | `--perspective-*`         |
| `aspect`       | `--aspect-*`              |
| `shadow`       | `--shadow-*`              |
| `insetShadow`  | `--inset-shadow-*`        |
| `dropShadow`   | `--drop-shadow-*`         |
| `textShadow`   | `--text-shadow-*`         |
| `duration`     | `--transition-duration-*` |

`text` accepts font sizes (`dimension`) or whole `typography` tokens. A
typography token emits `--text-<key>` plus its `--line-height`,
`--letter-spacing` and `--font-weight` sub-properties, and a native
`--font-<key>` for its family. Write `text-heading font-heading`: `leading-*`,
`tracking-*`, the `text-heading/7` line-height modifier and `font-*` overrides
(`text-heading font-mono`) all compose, because the family is a regular
`font-*` utility. Set `typographyUtilities: true` to also emit a
`text-<key>` `@utility` that applies the family, at the cost of `font-*`
overrides and the `/7` modifier no longer reaching it.

`shadow` tokens feed Tailwind's composite shadow stack, so `shadow-card ring-2`
renders both. A shadow that no theme overrides (directly or through an alias)
is inlined with its colour as a `var()`, so Tailwind can recolour it:
`shadow-card/50` and `shadow-red-500` work. A shadow a theme overrides stays a
`var()`, because Tailwind cannot parse one: those modifiers have no effect
there and `build` warns. The same applies to `insetShadow`,
`dropShadow` and `textShadow`.

`defaults` takes single tokens for Tailwind's `--default-*` keys: `font`
(`fontFamily`, `--default-font-family`), `monoFont` (`fontFamily`,
`--default-mono-font-family`), `transitionDuration` (`duration`,
`--default-transition-duration`) and `transitionTimingFunction`
(`cubicBezier`, `--default-transition-timing-function`). `resetDefaults`
does not touch them.

Because the theme is `inline`, `--color-*` variables are not emitted at
runtime. In hand-written CSS use `--theme(--color-accent)` or the recontent
variable (`var(--system-colors-accent)`).

Mind Tailwind's own lookups: `--spacing-*` also feeds width, height and `max-w-*` utilities, so spacing keys such as `lg` or `xl` override the container sizes behind `max-w-lg` (use `max-w-[32rem]` or a `container` group instead). `build` warns when a spacing key does this.

Other options: `filename`, `themeSelector` (`"class"` by default) /
`themeAttribute`, `themeVariants` (emit `@custom-variant <theme>` for every
theme, kebab-cased, e.g. `dark:` and `high-contrast:`; `false` or a list of
theme names to narrow; default `true`), and `resetDefaults` (`true` or a list
of namespaces emits `--<ns>-*: initial;` to drop Tailwind's defaults; `"all"`
emits `--*: initial;` to start from an empty theme), `layer` (the
generated `:root` and theme blocks sit in `@layer theme` by default so your own
`@layer base`/`theme` CSS can override a token; give another name, or `false`
to leave them unlayered) and `typographyUtilities` (see above).
A typography `text-<key>` that collides with an emitted `--color-<key>`, and
duplicate keys (including `--font-<key>` from typography vs a `font` key), are
reported as errors by `build`, which also warns when
a theme is named like a built-in Tailwind variant (`print`, `hover`, `open`, …),
since its `@custom-variant` would replace it; `dark` is exempt.

## Commands

```
recontent init                    Scaffold a recontent.config.ts
recontent init --from <sources>   Generate recontent.config.ts from DTCG tokens
recontent build [-w]              Run configured plugins and write their output
recontent diff [rev]              Compare tokens against a git revision (default HEAD)
                                  --format <markdown|json> (default markdown)
```

, or
`constructor` / `prototype` / `__proto__`) are renamed, with a warning.

## Global options

These apply to every command and must be given before the subcommand name
(e.g. `recontent --cwd apps/web build`, not `recontent build --cwd apps/web`)
— except `-c/--config`, which is deliberately accepted in both positions, so
`recontent build -c recontent.config.ts` also works:

- `-c, --config <path>` — path to the config file. When omitted, `recontent`
  searches upward from `--cwd` for `recontent.config.{ts,mts,js,mjs}`,
  stopping at the filesystem root or the first directory that has a
  `package.json` but no config of its own.
- `--cwd <dir>` — the directory every relative path in the run (config
  discovery, plugin output) is resolved against. Defaults to
  the process's own working directory. Use this instead of spawning the CLI
  with a different working directory.
- `--log-level <info|debug>` — defaults to `$RECONTENT_LOG_LEVEL`, then the
  config's own `logLevel`.

## Exit codes

- `0` — success.
- `1` — a `recontent`-reported failure: config/registry validation errors,
  a breaking diff with `--fail-on-breaking`, or a plugin error.
- `2` — a usage error: an unknown command or flag, or a missing argument.

All human-readable progress goes to stderr; stdout is reserved for command
payloads. `recontent build 1>/dev/null` still shows progress; `2>/dev/null`
is silent on a successful run.

### CI

```yaml
- name: Check tokens for breaking changes
  run: npx recontent diff --fail-on-breaking
```

The step's exit code is the whole contract: `0` means no breaking change,
`1` means a token was removed, renamed, or retyped since the base revision,
and `2` means the invocation itself was wrong (e.g. an unknown flag) rather
than a finding about your tokens.

`diff` loads and executes the compared revision's `recontent.config.ts`, so
it only accepts revisions that are already an ancestor of `HEAD` — comparing
against an unmerged branch or any other third-party-writable ref is
intentionally unsupported. Merge or rebase first. On a shallow checkout
(`actions/checkout`'s default `fetch-depth: 1`), fetch enough history for the
ancestry check to run, e.g. `git fetch --unshallow` or a deeper
`fetch-depth`.
