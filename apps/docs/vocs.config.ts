import { defineConfig } from "vocs/config";
import { sidebar } from "./sidebar.ts";

export default defineConfig({
  title: "Recontent.app",
  description:
    "Define typed tokens, introspect React components, and serve both from one CLI to your team, coding agents, and CI.",
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
    {
      text: "Changelog",
      link: "https://github.com/recontentapp/recontent/releases",
      external: true,
    },
  ],
  sidebar,
  twoslash: {},
});
