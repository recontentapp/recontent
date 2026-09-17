import type { Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import { themeClass } from "../src/generated/tokens.css";
import "../src/generated/reset.gen.css";

const preview: Preview = {
  decorators: [
    (Story) => {
      // Theme tokens are exposed as CSS custom properties scoped to `themeClass`.
      // Popovers/dialogs/etc. render through a portal appended to `<body>`, which
      // sits outside a wrapper div, so the class has to live on `<html>` for
      // portaled content to inherit the theme's CSS variables too.
      useEffect(() => {
        document.documentElement.classList.add(themeClass);
        return () => document.documentElement.classList.remove(themeClass);
      }, []);

      return <Story />;
    },
  ],
};

export default preview;
