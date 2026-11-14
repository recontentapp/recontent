import { copy, eyebrow, header, page, panel, title } from "./App.css";
import { themeClass } from "./generated/tokens.css";

export function App() {
  return (
    <main className={`${themeClass} ${page}`}>
      <div className={panel}>
        <span className={eyebrow}>Local design system</span>
        <div className={header}>
          <h1 className={title}>recontent playground</h1>
          <p className={copy}>
            Edit <code>recontent.config.ts</code>, then run <code>pnpm dev:tokens</code> to
            regenerate the tokens, the docs and DESIGN.md.
          </p>
        </div>
      </div>
    </main>
  );
}
