import { createLogger } from "../../logger.js";
import { exitWithError } from "../utils/exit.js";
import { findPreset, PRESET_NAMES } from "../presets/index.js";
import { writeOutputFile } from "../utils/fs.js";

export type InitOptions = {
  cwd: string;
  configPath: string;
  preset: string;
  force?: boolean;
};

export async function runInit(options: InitOptions): Promise<void> {
  const { configPath, cwd } = options;

  const preset = findPreset(options.preset);
  if (!preset) {
    exitWithError(
      `Unknown preset "${options.preset}". Available presets: ${PRESET_NAMES.join(", ")}.`,
    );
    return;
  }

  // `writeMode: "once"` checks existsSync() before writing — not perfectly
  // atomic, but avoids inverting control flow through a catch block.
  const { written } = await writeOutputFile(configPath, preset.source, cwd, {
    writeMode: options.force ? "always" : "once",
  });

  if (!written) {
    exitWithError(
      `recontent.config.ts already exists at "${configPath}". Use --force to overwrite.`,
    );
    return;
  }

  createLogger().info(`Created ${configPath} from the "${preset.name}" preset`);
}
