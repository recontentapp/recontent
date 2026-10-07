# Recontent.app

`recontent` is a CLI for design token tooling: define tokens once in a
`recontent.config.ts`, then generate CSS, vanilla-extract, TypeScript, StyleX,
DTCG (`.tokens.json`), Tailwind v4 CSS, or an HTML token report from it. Every output is a
plugin listed in the config and run by `recontent build`:

```ts
import { css, dtcg, html } from "recontent/plugins";

export default defineConfig({
  tokens: { ref, system, components },
  plugins: [css({ outDir: "dist" }), dtcg({ outDir: "tokens" }), html({ outDir: "docs" })],
});
```

`dtcg()` writes `tokens.tokens.json` plus one `<theme>.tokens.json` per theme;
`html()` writes `tokens.html`.

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
there and `recontent doctor` warns. The same applies to `insetShadow`,
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

Mind Tailwind's own lookups: `--spacing-*` also feeds width, height and `max-w-*` utilities, so spacing keys such as `lg` or `xl` override the container sizes behind `max-w-lg` (use `max-w-[32rem]` or a `container` group instead). `recontent doctor` warns when a spacing key does this.

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
reported as errors by `recontent doctor` and `build`. `doctor` also warns when
a theme is named like a built-in Tailwind variant (`print`, `hover`, `open`, …),
since its `@custom-variant` would replace it; `dark` is exempt.

## Commands

```
recontent init                    Scaffold a recontent.config.ts
recontent build [-w]              Run configured plugins and write their output
recontent doctor                  Validate config, registry, and dependencies
recontent diff [rev]              Compare tokens against a git revision (default HEAD)
                                  --format <markdown|json> (default markdown)
```

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
- `1` — a `recontent`-reported failure: config/registry validation errors
  (`doctor`), a breaking diff with `--fail-on-breaking`, or a plugin error.
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
