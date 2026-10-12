import { defineConfig } from "vocs/config";
import { sidebar } from "./sidebar.ts";

export default defineConfig({
  title: "Recontent",
  description:
    "Define design tokens once. Generate CSS, Tailwind, vanilla-extract, StyleX, TypeScript and DTCG.",
  baseUrl: process.env.DOCS_BASE_URL, // set once hosting is chosen
  renderStrategy: "full-static",
  logoUrl: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
  iconUrl: "/favicon.svg",
  editLink: {
    link: "https://github.com/recontentapp/recontentapp/edit/master/apps/docs/src/pages/:path",
    text: "Suggest changes",
  },
  socials: [{ icon: "github", link: "https://github.com/recontentapp/recontentapp" }],
  topNav: [
    { text: "npm", link: "https://www.npmjs.com/package/recontent", external: true },
    { text: "Changelog", link: "/changelog" },
  ],
  sidebar,
  twoslash: {},
});
