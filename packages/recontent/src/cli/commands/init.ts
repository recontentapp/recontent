import { createLogger } from "../../logger.js";
import { exitWithError } from "../utils/exit.js";
import { writeOutputFile } from "../utils/fs.js";

const CONFIG_TEMPLATE = `import {
  defineReferenceTokens,
  defineSystemTokens,
  defineComponentTokens,
  defineConfig,
  tokens,
} from "recontent";

const ref = defineReferenceTokens({
  color: {
    brand: {
      primary: tokens.color("#2563eb"),
      secondary: tokens.color("#7c3aed"),
    },
    neutral: {
      50: tokens.color("#f9fafb"),
      900: tokens.color("#111827"),
    },
  },
  spacing: {
    4: tokens.dimension("4px"),
    8: tokens.dimension("8px"),
    16: tokens.dimension("16px"),
  },
});

const system = defineSystemTokens({
  color: {
    background: ref.color.neutral[50],
    foreground: ref.color.neutral[900],
    accent: ref.color.brand.primary,
  },
  spacing: {
    sm: ref.spacing[4],
    md: ref.spacing[8],
    lg: ref.spacing[16],
  },
});

const components = defineComponentTokens({});

export default defineConfig({
  tokens: {
    ref,
    system,
    components,
  },
});
`;

export type InitOptions = {
  cwd: string;
  configPath: string;
  force?: boolean;
};

export async function runInit(options: InitOptions): Promise<void> {
  const { configPath, cwd } = options;

  // `writeMode: "once"` checks existsSync() before writing — not perfectly
  // atomic, but avoids inverting control flow through a catch block.
  const { written } = await writeOutputFile(configPath, CONFIG_TEMPLATE, cwd, {
    writeMode: options.force ? "always" : "once",
  });

  if (!written) {
    exitWithError(
      `recontent.config.ts already exists at "${configPath}". Use --force to overwrite.`,
    );
    return;
  }

  createLogger().info(`Created ${configPath}`);
}
