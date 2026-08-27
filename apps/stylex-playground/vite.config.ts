import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import stylexPlugin from "@stylexjs/rollup-plugin";

export default defineConfig({
  plugins: [
    // `runtimeInjection` makes StyleX inject its collected rules into a
    // <style> tag at runtime, which keeps the dev server and build simple
    // (no separate CSS extraction/import step is needed).
    stylexPlugin({
      runtimeInjection: true,
      unstable_moduleResolution: { type: "commonJS", rootDir: __dirname },
    }),
    react(),
  ],
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  },
});
