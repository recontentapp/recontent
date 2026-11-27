import { useState } from "react";
import {
  axisGroup,
  axisLabel,
  banner,
  card,
  cardHeader,
  cardMeta,
  cardTitle,
  code,
  controls,
  copy,
  eyebrow,
  eyebrowRow,
  header,
  page,
  panel,
  pill,
  pillRow,
  showcase,
  title,
} from "./App.css";
import { Sticker } from "./components";
import { brandThemes, densityThemes, modeThemes, themeClass } from "./generated/tokens.css";

type Mode = keyof typeof modeThemes;
type Brand = keyof typeof brandThemes;
type Density = keyof typeof densityThemes;

const modes = Object.keys(modeThemes) as Mode[];
const brands = Object.keys(brandThemes) as Brand[];
const densities = Object.keys(densityThemes) as Density[];

export function App() {
  const [mode, setMode] = useState<Mode>("light");
  const [brand, setBrand] = useState<Brand>("neutral");
  const [density, setDensity] = useState<Density>("comfortable");

  const activeThemeClasses = [
    themeClass,
    modeThemes[mode],
    brandThemes[brand],
    densityThemes[density],
    page,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={activeThemeClasses}>
      <div className={panel}>
        <div className={eyebrowRow}>
          <span className={eyebrow}>Local design system</span>
          <Sticker tilt="right">Themed</Sticker>
        </div>

        <div className={header}>
          <h1 className={title}>recontent playground</h1>
          <p className={copy}>
            Edit <code className={code}>recontent.config.ts</code>, then run{" "}
            <code className={code}>pnpm dev:tokens</code> to regenerate the tokens, the docs and
            DESIGN.md.
          </p>
        </div>

        <div className={controls}>
          <div className={axisGroup}>
            <span className={axisLabel}>Mode</span>
            <div className={pillRow}>
              {modes.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={pill}
                  aria-pressed={mode === option}
                  onClick={() => setMode(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={axisGroup}>
            <span className={axisLabel}>Brand</span>
            <div className={pillRow}>
              {brands.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={pill}
                  aria-pressed={brand === option}
                  onClick={() => setBrand(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={axisGroup}>
            <span className={axisLabel}>Density</span>
            <div className={pillRow}>
              {densities.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={pill}
                  aria-pressed={density === option}
                  onClick={() => setDensity(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={showcase}>
          <div className={banner}>
            <h2 className={cardTitle}>Resolution order</h2>
            <p className={cardMeta}>
              mode ({mode}) → brand ({brand}) → density ({density})
            </p>
          </div>

          <div className={card}>
            <div className={cardHeader}>
              <h2 className={cardTitle}>Component tokens</h2>
              <Sticker tilt="left">New</Sticker>
            </div>
            <p className={copy}>
              Surfaces, shadows, borders, spacing, and Sticker density compose additively.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
