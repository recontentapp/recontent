import { copy, eyebrow, page, panel, title } from "./App.css";
import { Stack } from "./design-system/components/stack/Stack.gen";
import { themeClass } from "./design-system/tokens.css";

export function App() {
  return (
    <main className={`${themeClass} ${page}`}>
      <Stack gap="lg" className={panel}>
        <span className={eyebrow}>Local design system</span>
        <Stack gap="sm">
          <h1 className={title}>recontent playground</h1>
          <p className={copy}>
            Edit <code>recontent.config.ts</code>, then run <code>yarn dev:tokens</code> to
            regenerate this component and its tokens.
          </p>
        </Stack>
      </Stack>
    </main>
  );
}
