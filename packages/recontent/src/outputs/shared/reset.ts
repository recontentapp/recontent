export interface CssResetOptions {
  fontFamily: string;
  placeholderColor: string;
}

export function generateCssResetSource(options: CssResetOptions): string {
  const { fontFamily, placeholderColor } = options;

  return `import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./tokens.css";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
});

globalStyle("*:not(dialog)", {
  margin: 0,
});

globalStyle("html", {
  "@media": {
    "(prefers-reduced-motion: no-preference)": {
      interpolateSize: "allow-keywords",
    },
  },
});

globalStyle("body", {
  lineHeight: 1.5,
  WebkitFontSmoothing: "antialiased",
  fontFamily: ${fontFamily},
});

globalStyle("img, picture, video, canvas, svg", {
  display: "block",
  maxWidth: "100%",
});

globalStyle("input, button, textarea, select", {
  font: "inherit",
});

globalStyle("p, h1, h2, h3, h4, h5, h6", {
  overflowWrap: "break-word",
});

globalStyle("p", {
  textWrap: "pretty",
});

globalStyle("h1, h2, h3, h4, h5, h6", {
  textWrap: "balance",
});

globalStyle("::placeholder", {
  color: ${placeholderColor},
});
`;
}
