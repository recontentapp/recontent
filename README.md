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
yarn install
yarn build        # packages, playgrounds and the docs site
yarn typecheck
yarn test
yarn lint
yarn format:check
yarn knip
```

To work on the docs, run `yarn workspace docs dev`.
