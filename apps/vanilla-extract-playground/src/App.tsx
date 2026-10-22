import { copy, eyebrow, page, panel, title } from "./App.css";
import { Stack } from "./generated/components/stack/Stack.gen";
import { themeClass } from "./generated/tokens.css";

export function App() {
  return (
    <main className={`${themeClass} ${page}`}>
      <Stack gap={24} className={panel}>
        <span className={eyebrow}>Local design system</span>
        <Stack gap={8}>
          <h1 className={title}>recontent playground</h1>
          <p className={copy}>
            Edit <code>recontent.config.ts</code>, then run <code>pnpm dev:tokens</code> to
            regenerate this component and its tokens.
          </p>
        </Stack>
      </Stack>
    </main>
  );
}
