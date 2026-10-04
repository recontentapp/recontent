export interface CssResetOptions {
  fontFamily: string;
  placeholderColor: string;
}

type ResetDeclaration = {
  property: string;
  value: string;
  /** Raw JS (a numeric literal or a token-binding reference) — not JS-string-quoted. */
  raw?: true;
};

type ResetRule = {
  selector: string;
  media?: string;
  declarations: ResetDeclaration[];
};

/**
 * Single source of truth for the reset rules, shared by the vanilla-extract
 * (`globalStyle`) and StyleX (plain CSS) emitters so they can't drift.
 * `fontFamily`/`placeholderColor` are embedded verbatim: a raw JS expression
 * for vanilla-extract's `globalStyle` object, a `var(...)` reference for
 * plain CSS — in both cases as `raw`, since they're never JS-string-quoted.
 */
export function resetRules(options: CssResetOptions): ResetRule[] {
  const { fontFamily, placeholderColor } = options;
  return [
    {
      selector: "*, *::before, *::after",
      declarations: [{ property: "boxSizing", value: "border-box" }],
    },
    { selector: "*:not(dialog)", declarations: [{ property: "margin", value: "0", raw: true }] },
    {
      selector: "html",
      media: "(prefers-reduced-motion: no-preference)",
      declarations: [{ property: "interpolateSize", value: "allow-keywords" }],
    },
    {
      selector: "body",
      declarations: [
        { property: "lineHeight", value: "1.5", raw: true },
        { property: "WebkitFontSmoothing", value: "antialiased" },
        { property: "fontFamily", value: fontFamily, raw: true },
      ],
    },
    {
      selector: "img, picture, video, canvas, svg",
      declarations: [
        { property: "display", value: "block" },
        { property: "maxWidth", value: "100%" },
      ],
    },
    {
      selector: "input, button, textarea, select",
      declarations: [{ property: "font", value: "inherit" }],
    },
    {
      selector: "p, h1, h2, h3, h4, h5, h6",
      declarations: [{ property: "overflowWrap", value: "break-word" }],
    },
    { selector: "p", declarations: [{ property: "textWrap", value: "pretty" }] },
    {
      selector: "h1, h2, h3, h4, h5, h6",
      declarations: [{ property: "textWrap", value: "balance" }],
    },
    {
      selector: "::placeholder",
      declarations: [{ property: "color", value: placeholderColor, raw: true }],
    },
  ];
}
