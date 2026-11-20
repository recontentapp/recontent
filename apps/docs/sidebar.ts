import type { Config } from "vocs/config";

export const sidebar: NonNullable<Config["sidebar"]> = [
  {
    text: "Introduction",
    items: [
      { text: "Why Recontent", link: "/introduction/why-recontent" },
      { text: "Installation", link: "/introduction/installation" },
      { text: "Getting started", link: "/introduction/getting-started" },
    ],
  },
  {
    text: "Design tokens",
    items: [
      { text: "Defining tokens", link: "/guides/defining-tokens" },
      { text: "Working with themes", link: "/guides/working-with-themes" },
    ],
  },
  {
    text: "Components",
    items: [
      { text: "Introspecting components", link: "/guides/introspecting-components" },
      { text: "Documenting components", link: "/guides/documenting-components" },
    ],
  },
  {
    text: "Agents & consumers",
    items: [
      { text: "Coding with agents", link: "/guides/agents" },
      { text: "Publishing your design system", link: "/guides/publishing" },
    ],
  },
  {
    text: "Workflow",
    items: [
      { text: "Using plugins", link: "/guides/using-plugins" },
      { text: "Catching breaking changes", link: "/guides/diffs" },
      { text: "Troubleshooting", link: "/guides/troubleshooting" },
    ],
  },
  {
    text: "Config reference",
    collapsed: true,
    items: [
      { text: "Configuration", link: "/config" },
      { text: "Primitives", link: "/config/primitives" },
      { text: "Scales", link: "/config/scales" },
      { text: "Composites", link: "/config/composites" },
    ],
  },
  {
    text: "Plugins reference",
    collapsed: true,
    items: [
      {
        text: "Styling",
        items: [
          { text: "CSS", link: "/plugins/css" },
          { text: "Tailwind", link: "/plugins/tailwind" },
          { text: "vanilla-extract", link: "/plugins/vanilla-extract" },
          { text: "StyleX", link: "/plugins/stylex" },
          { text: "TypeScript", link: "/plugins/typescript" },
          { text: "DTCG", link: "/plugins/dtcg" },
        ],
      },
      {
        text: "Docs & agents",
        items: [
          { text: "Docs", link: "/plugins/docs" },
          { text: "designMD", link: "/plugins/design-md" },
          { text: "inspect", link: "/plugins/inspect" },
        ],
      },
      {
        text: "Validation",
        items: [{ text: "Contrast", link: "/plugins/contrast" }],
      },
      { text: "Writing a plugin", link: "/plugin-api" },
    ],
  },
  {
    text: "CLI reference",
    collapsed: true,
    items: [
      { text: "Overview", link: "/cli" },
      { text: "init", link: "/cli/init" },
      { text: "build", link: "/cli/build" },
      { text: "inspect", link: "/cli/inspect" },
      { text: "diff", link: "/cli/diff" },
    ],
  },
];
