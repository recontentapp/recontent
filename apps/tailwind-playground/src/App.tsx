import { useEffect, useState } from "react";

const primaryShades = ["100", "300", "500", "700", "900"] as const;

export function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background font-sans text-text transition-colors">
      <div className="flex max-w-[32rem] flex-col gap-md rounded-md border border-border bg-surface p-xl shadow-card">
        <span className="text-eyebrow uppercase text-accent">tailwind output</span>
        <h1 className="text-heading">recontent tailwind playground</h1>
        <p className="text-body text-text-muted">
          Edit <code className="font-mono text-accent-strong">recontent.config.ts</code>, then run{" "}
          <code className="font-mono text-accent-strong">yarn dev:tokens</code> to regenerate{" "}
          <code className="font-mono text-accent-strong">src/generated/tailwind</code>.
        </p>

        <div className="flex gap-sm">
          {primaryShades.map((shade) => (
            <span
              key={shade}
              className="size-xl rounded-sm"
              style={{ backgroundColor: `var(--ref-color-primary-${shade})` }}
            />
          ))}
        </div>

        <button
          type="button"
          className="self-start rounded-full border border-border bg-accent px-md py-sm text-sm font-medium text-white hover:bg-accent-strong dark:bg-accent-strong dark:hover:bg-accent"
          onClick={() => setDark((value) => !value)}
        >
          Switch to {dark ? "light" : "dark"} theme
        </button>
      </div>
    </main>
  );
}
