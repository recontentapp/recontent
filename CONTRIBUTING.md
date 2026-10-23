# Contributing to Recontent

Thanks for your interest in Recontent! Bug reports, documentation fixes, new plugins and ideas are
all welcome.

## Before you start

- **Bugs**: open an issue with the `recontent` version, your `recontent.config.ts` (or a minimal
  one that reproduces the problem), the command you ran and its output. Rerun it with
  `--log-level debug` to include the stack trace.
- **Features and new plugins**: open an issue to discuss the idea before writing code, so we can
  agree on the shape of the API first.
- **Small fixes** (typos, docs, obvious bugs): open a pull request directly.

## Repository layout

This is a pnpm workspace orchestrated with Turborepo.

| Path                 | What it is                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `packages/recontent` | The `recontent` package published to npm: CLI, `define*` API and built-in plugins          |
| `packages/core`      | `@recontentapp/core`: config loading, token registry, color handling and the plugin runner |
| `apps/docs`          | The documentation site, built with Vocs                                                    |
| `apps/*-playground`  | Example projects for the Tailwind, StyleX and vanilla-extract plugins                      |
| `.github/workflows`  | CI (build, lint, format, typecheck, test, knip) and npm publishing                         |

## Setup

You need Node.js 24 and pnpm (the version pinned in `package.json`, which
[Corepack](https://nodejs.org/api/corepack.html) can install for you).

```bash
git clone git@github.com:recontentapp/recontent.git
cd recontent
pnpm install
pnpm build
```

`pnpm install` also installs the [lefthook](https://lefthook.dev) git hooks, which lint and format
staged files on commit.

## Development

Run these from the repository root:

| Script           | Does                                         |
| ---------------- | -------------------------------------------- |
| `pnpm build`     | Build every package                          |
| `pnpm typecheck` | Type-check every package                     |
| `pnpm test`      | Run every test suite                         |
| `pnpm lint`      | Lint the repository (`pnpm lint:fix` to fix) |
| `pnpm format`    | Format the repository (`pnpm format:check`)  |
| `pnpm knip`      | Find unused files, exports and dependencies  |

Typecheck and tests rely on built packages, so run `pnpm build` first.

To try the CLI on a real project, build it and run it against the docs' own config:

```bash
pnpm build
node packages/recontent/dist/cli/bin.mjs build -c apps/docs/recontent.config.ts
```

To work on the documentation, run `pnpm --filter docs dev`.

## Tests

Prefer integration tests that exercise observable behavior (a config in, files or CLI output out)
over tests of internal helpers. Most tests live in `packages/recontent/test`, with fixtures in
`test/fixtures` and snapshots in `test/__snapshots__`. If a change intentionally modifies a
plugin's output, update the snapshots and review the diff carefully: it is what users will see.

## Pull requests

- Branch off `master` and keep a pull request focused on one change.
- Make sure `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` and `pnpm format:check` pass.
  CI runs the same checks, plus `pnpm knip`.
- Update the documentation in `apps/docs/src/pages` when you change behavior, options or output.
- Edit the root `README.md` only: the pre-commit hook copies it to `packages/recontent/README.md`,
  which is the README published to npm.
- Prefer the simplest change that solves the problem. Don't keep complexity because it already
  exists, and don't add abstractions for needs we don't have yet.

## Releases

Maintainers release by bumping `packages/core` and `packages/recontent` to the same version and
publishing a GitHub release tagged with that version. The publish workflow checks that the tag
matches and publishes both packages to npm with provenance.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
