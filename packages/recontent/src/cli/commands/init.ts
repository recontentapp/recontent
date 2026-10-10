import { createLogger } from "../../logger.js";
import { exitWithError } from "../utils/exit.js";
import { generateConfigFromDtcg } from "../dtcg-import/index.js";
import type { DtcgImportStats } from "../dtcg-import/index.js";
import { findPreset, PRESET_NAMES } from "../presets/index.js";
import { writeOutputFile } from "../utils/fs.js";

export type InitOptions = {
  cwd: string;
  configPath: string;
  /** Preset to scaffold from; ignored when `from` is given. */
  preset?: string;
  force?: boolean;
  /** DTCG sources (resolver, token files or directories) to generate the config from. */
  from?: string[];
};

function describeImport({ tokens, ref, system, themes, skipped }: DtcgImportStats): string {
  return `Imported ${tokens} tokens (${ref} ref, ${system} system), ${themes} themes; skipped ${skipped}`;
}

export async function runInit(options: InitOptions): Promise<void> {
  const { configPath, cwd, from } = options;

  const imported = from ? generateConfigFromDtcg({ sources: from, cwd }) : undefined;

  let source: string;
  let presetName: string | undefined;
  if (imported) {
    source = imported.source;
  } else {
    const preset = options.preset ? findPreset(options.preset) : undefined;
    if (!preset) {
      exitWithError(
        `Unknown preset "${options.preset}". Available presets: ${PRESET_NAMES.join(", ")}.`,
      );
      return;
    }
    source = preset.source;
    presetName = preset.name;
  }

  // `writeMode: "once"` checks existsSync() before writing — not perfectly
  // atomic, but avoids inverting control flow through a catch block.
  const { written } = await writeOutputFile(configPath, source, cwd, {
    writeMode: options.force ? "always" : "once",
  });

  if (!written) {
    exitWithError(
      `recontent.config.ts already exists at "${configPath}". Use --force to overwrite.`,
    );
    return;
  }

  const logger = createLogger();
  logger.info(
    presetName ? `Created ${configPath} from the "${presetName}" preset` : `Created ${configPath}`,
  );
  if (imported) {
    logger.info(describeImport(imported.stats));
    for (const warning of imported.warnings) logger.warn(warning);
  }
}
