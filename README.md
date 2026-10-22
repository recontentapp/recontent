# Recontent.app

Recontent is a design system toolchain which helps engineers and designers manage design tokens and
bootstrap design systems faster with pre-built components. Define tokens once in a typed
`recontent.config.ts`, then generate CSS, Tailwind, vanilla-extract, StyleX, TypeScript, DTCG and a
token catalogue from them.

It ships as a command line interface, so humans, agents and CI use it the same way. See
[`packages/recontent`](packages/recontent) for a quick start.

## Repository

| Path                 | Description                                                                  |
| -------------------- | ---------------------------------------------------------------------------- |
| `packages/recontent` | The `recontent` CLI, token API and built-in plugins                          |
| `packages/core`      | `@recontentapp/core`: the token model and plugin types                       |
| `apps/docs`          | The documentation site ([Vocs](https://vocs.dev)); see its `CONTRIBUTING.md` |
| `apps/*-playground`  | Example projects for the Tailwind, vanilla-extract and StyleX outputs        |

## Development

```bash
pnpm install
pnpm build        # packages, playgrounds and the docs site
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
pnpm knip
```

To work on the docs, run `pnpm --filter docs dev`.

### TypeScript 6 and 7

`tsc` is the native TypeScript 7 compiler, installed as `@typescript/native` (an alias of
`typescript@7`). TypeScript 7 has no programmatic API yet, so code that does `import ts from
"typescript"` gets TypeScript 6 through `typescript: npm:@typescript/typescript6` (which only
provides `tsc6`, so the two `tsc` binaries never collide). `apps/docs` uses the real
`typescript@6` because twoslash needs its `lib.*.d.ts` files.
