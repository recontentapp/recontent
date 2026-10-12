# Contributing to the docs

The docs are a [Vocs](https://vocs.dev) site. Pages live in `src/pages` as MDX, and the sidebar is
defined in `sidebar.ts`.

```bash
yarn workspace docs dev      # http://localhost:5173
yarn workspace docs build    # static site in dist/
yarn workspace docs preview  # serve the static build
yarn workspace docs test     # build every snippet in src/snippets
```

`recontent` is built before the docs (`turbo run build` takes care of it), because examples are
type-checked against its built types.

## Page types

- **Introduction and Guides** are task-oriented: the minimum number of steps, real snippets, and a
  link to the reference for options.
- **Reference pages** (tokens, plugins, CLI, plugin API) are complete and dry: every option, default,
  emitted file and diagnostic. No story.

When you add a page, add it to `sidebar.ts`. A dead link fails the build.

## Examples

- Mark every snippet that imports from `recontent` or `recontent/plugins` as ` ```ts twoslash `. The
  build type-checks it, so an example that drifts from the API fails CI. To hide setup code, put it
  above a `// ---cut---` line.
- Put long examples in `src/snippets/` as a complete `*.config.ts`, and include them in a page:

  ````md
  ```ts twoslash
  // [!include ~/snippets/tailwind.config.ts]
  ```
  ````

  `yarn workspace docs test` builds each snippet with the real CLI and fails if it errors or warns,
  so these examples cannot rot.

- Before documenting what a plugin emits, run it and paste the real output.
- Where the content comes from, so nothing is written from memory: `packages/recontent/src/cli/bin.ts`
  (CLI), each `*PluginOptions` type in `packages/recontent/src/plugins` (plugin options),
  `packages/recontent/src/tokens.ts` (token factories) and `packages/core/src/plugins/types.ts`
  (plugin API).

## Hosting

`vocs.config.ts` uses `renderStrategy: "full-static"`, so `dist/public` can be served by any static
host. Set `DOCS_BASE_URL` at build time (and `basePath` in the config, for a subpath) to enable the
sitemap and canonical URLs.
