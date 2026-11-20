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
  | { path: '/cli/inspect'; render: 'static' }
  | { path: '/config/composites'; render: 'static' }
  | { path: '/config'; render: 'static' }
  | { path: '/config/primitives'; render: 'static' }
  | { path: '/config/scales'; render: 'static' }
  | { path: '/guides/agents'; render: 'static' }
  | { path: '/guides/defining-tokens'; render: 'static' }
  | { path: '/guides/diffs'; render: 'static' }
  | { path: '/guides/documenting-components'; render: 'static' }
  | { path: '/guides/introspecting-components'; render: 'static' }
  | { path: '/guides/publishing'; render: 'static' }
  | { path: '/guides/troubleshooting'; render: 'static' }
  | { path: '/guides/using-plugins'; render: 'static' }
  | { path: '/guides/working-with-themes'; render: 'static' }
  | { path: '/'; render: 'static' }
  | { path: '/introduction/getting-started'; render: 'static' }
  | { path: '/introduction/installation'; render: 'static' }
  | { path: '/introduction/why-recontent'; render: 'static' }
  | { path: '/plugin-api'; render: 'static' }
  | { path: '/plugins/css'; render: 'static' }
  | { path: '/plugins/design-md'; render: 'static' }
  | { path: '/plugins/docs'; render: 'static' }
  | { path: '/plugins/dtcg'; render: 'static' }
  | { path: '/plugins/inspect'; render: 'static' }
  | { path: '/plugins/stylex'; render: 'static' }
  | { path: '/plugins/tailwind'; render: 'static' }
  | { path: '/plugins/typescript'; render: 'static' }
  | { path: '/plugins/vanilla-extract'; render: 'static' }

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>
  }
  interface CreatePagesConfig {
    pages: Page
  }
}
