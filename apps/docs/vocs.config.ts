import { defineConfig } from "vocs/config";
import { sidebar } from "./sidebar.ts";

export default defineConfig({
  title: "Recontent.app",
  description:
    "Recontent turns your tokens and components into a design system that people, agents and CI can read.",
  baseUrl: process.env.DOCS_BASE_URL, // set once hosting is chosen
  renderStrategy: "full-static",
  logoUrl: { light: "/logo-light.svg", dark: "/logo-dark.svg" },
  iconUrl: "/favicon.png",
  editLink: {
    link: "https://github.com/recontentapp/recontent/edit/master/apps/docs/src/pages/:path",
    text: "Suggest changes",
  },
  socials: [{ icon: "github", link: "https://github.com/recontentapp/recontent" }],
  topNav: [
    { text: "npm", link: "https://www.npmjs.com/package/recontent", external: true },
    { text: "Changelog", link: "/changelog" },
  ],
  sidebar,
  twoslash: {},
});
