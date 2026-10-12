import type { Config } from "vocs/config";

export const sidebar: NonNullable<Config["sidebar"]> = [
  {
    text: "Introduction",
    items: [
      { text: "Installation", link: "/introduction/installation" },
      { text: "Getting started", link: "/introduction/getting-started" },
      { text: "Why Recontent", link: "/introduction/why-recontent" },
    ],
  },
  {
    text: "Guides",
    items: [
      { text: "Defining tokens", link: "/guides/defining-tokens" },
      { text: "Working with themes", link: "/guides/working-with-themes" },
      { text: "Using plugins", link: "/guides/using-plugins" },
      { text: "Diffs", link: "/guides/diffs" },
    ],
  },
  {
    text: "Tokens reference",
    collapsed: true,
    items: [
      { text: "Configuration", link: "/tokens/configuration" },
      { text: "Primitives", link: "/tokens/primitives" },
      { text: "Scales", link: "/tokens/scales" },
      { text: "Composites", link: "/tokens/composites" },
    ],
  },
  {
    text: "Built-in plugins",
    collapsed: true,
    items: [
      { text: "CSS", link: "/plugins/css" },
      { text: "Tailwind", link: "/plugins/tailwind" },
      { text: "Vanilla Extract", link: "/plugins/vanilla-extract" },
      { text: "StyleX", link: "/plugins/stylex" },
      { text: "TypeScript", link: "/plugins/typescript" },
      { text: "DTCG", link: "/plugins/dtcg" },
      { text: "Docs", link: "/plugins/docs" },
    ],
  },
  {
    text: "CLI reference",
    collapsed: true,
    items: [
      { text: "Overview", link: "/cli" },
      { text: "init", link: "/cli/init" },
      { text: "build", link: "/cli/build" },
      { text: "diff", link: "/cli/diff" },
    ],
  },
  { text: "Plugin API", link: "/plugin-api" },
];
