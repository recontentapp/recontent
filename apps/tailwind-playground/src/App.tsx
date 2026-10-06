import { useEffect, useState } from "react";

// Full class names so Tailwind's scanner picks them up.
const shadeClasses = {
  "1": "bg-primary-1",
  "2": "bg-primary-2",
  "3": "bg-primary-3",
  "4": "bg-primary-4",
  "5": "bg-primary-5",
  "6": "bg-primary-6",
  "7": "bg-primary-7",
  "8": "bg-primary-8",
  "9": "bg-primary-9",
  "10": "bg-primary-10",
  "11": "bg-primary-11",
  "12": "bg-primary-12",
} as const;
const primaryShades = Object.keys(shadeClasses) as (keyof typeof shadeClasses)[];

export function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground transition-colors">
      <div className="flex max-w-[32rem] flex-col gap-md rounded-md border border-border bg-surface p-xl shadow-card">
        <span className="font-eyebrow text-eyebrow uppercase text-accent">tailwind output</span>
        <h1 className="font-heading text-heading">recontent tailwind playground</h1>
        <p className="font-body text-body text-muted-foreground">
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
          <p className="font-heading text-heading tracking-tight">
            font-heading text-heading tracking-tight
          </p>
          <p className="text-body font-mono">text-body font-mono (the family override wins)</p>
          <p className="rounded-md bg-background p-md font-body text-body shadow-card ring-1 ring-border">
            shadow-card ring-1 ring-border
          </p>
          <p className="rounded-md bg-background p-md font-body text-body shadow-card/50">
            shadow-card/50 (opacity modifier on the shadow colour)
          </p>
        </div>

        <button
          type="button"
          className="self-start rounded-full border border-border bg-accent transition duration-fast px-md py-sm text-sm font-medium text-accent-foreground hover:bg-accent-strong dark:bg-accent-strong dark:hover:bg-accent"
          onClick={() => setDark((value) => !value)}
        >
          Switch to {dark ? "light" : "dark"} theme
        </button>
      </div>
    </main>
  );
}
