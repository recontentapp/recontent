import { globalStyle } from "@vanilla-extract/css";

// 1. Use a more-intuitive box-sizing model
globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

// 2. Remove default margin
globalStyle("*:not(dialog)", {
  margin: 0,
});

// 3. Enable keyword animations
globalStyle("html", {
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      interpolateSize: "allow-keywords",
    },
  },
});

globalStyle("body", {
  // 4. Increase line-height
  lineHeight: 1.5,
  // 5. Improve text rendering
  WebkitFontSmoothing: "antialiased",
});

// 6. Improve media defaults
globalStyle("img, picture, video, canvas, svg", {
  display: "block",
  maxWidth: "100%",
});

// 7. Inherit fonts for form controls
globalStyle("input, button, textarea, select", {
  font: "inherit",
});

// 8. Avoid text overflows
globalStyle("p, h1, h2, h3, h4, h5, h6", {
  overflowWrap: "break-word",
});

// 9. Improve line wrapping
globalStyle("p", {
  textWrap: "pretty",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  textWrap: "balance",
});

// 10. Create a root stacking context
globalStyle("#root, #__next", {
  isolation: "isolate",
});
