import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig({
  plugins: [react(), vanillaExtractPlugin()],
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
  },
});
