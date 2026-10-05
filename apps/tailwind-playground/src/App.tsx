import { useEffect, useState } from "react";

// Full class names so Tailwind's scanner picks them up.
const shadeClasses = {
  "100": "bg-primary-100",
  "300": "bg-primary-300",
  "500": "bg-primary-500",
  "700": "bg-primary-700",
  "900": "bg-primary-900",
} as const;
const primaryShades = Object.keys(shadeClasses) as (keyof typeof shadeClasses)[];

export function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background font-sans text-foreground transition-colors">
      <div className="flex max-w-[32rem] flex-col gap-md rounded-md border border-border bg-surface p-xl shadow-card">
        <span className="text-eyebrow uppercase text-accent">tailwind output</span>
        <h1 className="text-heading">recontent tailwind playground</h1>
        <p className="text-body text-muted-foreground">
          Edit <code className="font-mono text-accent-strong">recontent.config.ts</code>, then run{" "}
          <code className="font-mono text-accent-strong">yarn dev:tokens</code> to regenerate{" "}
          <code className="font-mono text-accent-strong">src/generated/tailwind</code>.
        </p>

        <div className="flex gap-sm">
          {primaryShades.map((shade) => (
            <span key={shade} className={`size-xl rounded-sm ${shadeClasses[shade]}`} />
          ))}
        </div>

        <div className="flex flex-col gap-sm">
          <p className="text-heading tracking-tight">text-heading tracking-tight</p>
          <p className="rounded-md bg-background p-md text-body shadow-card ring-1 ring-border">
            shadow-card ring-1 ring-border
          </p>
        </div>

        <button
          type="button"
          className="self-start rounded-full border border-border bg-accent px-md py-sm text-sm font-medium text-accent-foreground hover:bg-accent-strong dark:bg-accent-strong dark:hover:bg-accent"
          onClick={() => setDark((value) => !value)}
        >
          Switch to {dark ? "light" : "dark"} theme
        </button>
      </div>
    </main>
  );
}
