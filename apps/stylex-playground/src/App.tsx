import { useState } from "react";
import * as stylex from "@stylexjs/stylex";

import { vars } from "./generated/stylex/tokens.stylex";
import { refColorPrimary, refColorNeutral } from "./generated/stylex/scales";
import { darkTheme } from "./generated/stylex/themes";

const styles = stylex.create({
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: vars.systemColorsBackground,
    color: vars.systemColorsText,
    fontFamily: vars.systemFontFamily,
    transitionProperty: "background-color, color",
    transitionDuration: "150ms",
  },
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: vars.systemSpacingMd,
    padding: vars.systemSpacingXl,
    maxWidth: "32rem",
    backgroundColor: vars.systemColorsSurface,
    borderRadius: vars.systemRadiusMd,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: vars.systemColorsBorder,
  },
  eyebrow: {
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: vars.systemColorsAccent,
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: 0,
  },
  copy: {
    fontSize: "0.9rem",
    lineHeight: 1.5,
    color: vars.systemColorsTextMuted,
  },
  swatchRow: {
    display: "flex",
    gap: vars.systemSpacingSm,
  },
  swatch: {
    width: vars.systemSpacingXl,
    height: vars.systemSpacingXl,
    borderRadius: vars.systemRadiusSm,
  },
  button: {
    alignSelf: "flex-start",
    paddingBlock: vars.systemSpacingSm,
    paddingInline: vars.systemSpacingMd,
    borderRadius: vars.systemRadiusFull,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: vars.systemColorsBorder,
    backgroundColor: vars.systemColorsAccent,
    color: vars.refColorNeutral0,
    fontFamily: vars.systemFontFamily,
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
  },
});

const primaryShades = [100, 300, 500, 700, 900] as const;
const neutralShades = [100, 300, 500, 700, 900] as const;

export function App() {
  const [dark, setDark] = useState(false);

  return (
    <main {...stylex.props(dark && darkTheme, styles.page)}>
      <div {...stylex.props(styles.panel)}>
        <span {...stylex.props(styles.eyebrow)}>stylex output</span>
        <h1 {...stylex.props(styles.title)}>recontent stylex playground</h1>
        <p {...stylex.props(styles.copy)}>
          Edit <code>recontent.config.ts</code>, then run <code>pnpm dev:tokens</code> to regenerate{" "}
          <code>src/generated/stylex</code> and its StyleX vars.
        </p>

        <div {...stylex.props(styles.swatchRow)}>
          {primaryShades.map((shade) => (
            <span
              key={shade}
              {...stylex.props(styles.swatch)}
              style={{ backgroundColor: refColorPrimary[shade] }}
            />
          ))}
        </div>
        <div {...stylex.props(styles.swatchRow)}>
          {neutralShades.map((shade) => (
            <span
              key={shade}
              {...stylex.props(styles.swatch)}
              style={{ backgroundColor: refColorNeutral[shade] }}
            />
          ))}
        </div>

        <button
          type="button"
          {...stylex.props(styles.button)}
          onClick={() => setDark((value) => !value)}
        >
          Switch to {dark ? "light" : "dark"} theme
        </button>
      </div>
    </main>
  );
}
