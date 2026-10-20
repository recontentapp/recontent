// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages } from 'waku/router'

// prettier-ignore
type Page =
  | { path: '/changelog'; render: 'static' }
  | { path: '/cli/build'; render: 'static' }
  | { path: '/cli/diff'; render: 'static' }
  | { path: '/cli'; render: 'static' }
  | { path: '/cli/init'; render: 'static' }
  | { path: '/guides/defining-tokens'; render: 'static' }
  | { path: '/guides/diffs'; render: 'static' }
  | { path: '/guides/troubleshooting'; render: 'static' }
  | { path: '/guides/using-plugins'; render: 'static' }
  | { path: '/guides/working-with-themes'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/introduction/getting-started'; render: 'static' }
  | { path: '/introduction/installation'; render: 'static' }
  | { path: '/introduction/why-recontent'; render: 'static' }
  | { path: '/plugin-api'; render: 'static' }
  | { path: '/plugins/css'; render: 'static' }
  | { path: '/plugins/docs'; render: 'static' }
  | { path: '/plugins/dtcg'; render: 'static' }
  | { path: '/plugins/stylex'; render: 'static' }
  | { path: '/plugins/tailwind'; render: 'static' }
  | { path: '/plugins/typescript'; render: 'static' }
  | { path: '/plugins/vanilla-extract'; render: 'static' }
  | { path: '/tokens/composites'; render: 'static' }
  | { path: '/tokens/configuration'; render: 'static' }
  | { path: '/tokens/primitives'; render: 'static' }
  | { path: '/tokens/scales'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
