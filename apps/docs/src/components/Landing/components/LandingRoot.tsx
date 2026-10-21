"use client";

import { type ReactNode, useState } from "react";
import { Header, type Theme } from "./Header.tsx";

/** Holds the landing theme. Always starts light: the system preference is deliberately ignored. */
export function LandingRoot({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  return (
    <div className="lp-root" data-theme={theme}>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      />
      {children}
    </div>
  );
}
