import path from "node:path";
import { createLogger } from "../../logger.js";
import { exitWithError } from "../utils/exit.js";
import { generateConfigFromDtcg } from "../dtcg-import/index.js";
import type { DtcgImportStats } from "../dtcg-import/index.js";
import { getPreset } from "../presets/index.js";
import { plural } from "../utils/format.js";
import { displayPath, writeOutputFile } from "../utils/fs.js";

export type InitOptions = {
  cwd: string;
  configPath: string;
  force?: boolean;
  /** A preset name, or DTCG sources (resolver, token files or directories) to generate the config from. */
  source: { preset: string } | { from: string[] };
};

function describeImport({ tokens, ref, system, themes, skipped }: DtcgImportStats): string {
  const imported = `Imported ${plural(tokens, "token")} (${ref} ref, ${system} system) and ${plural(themes, "theme")}`;
  return skipped > 0 ? `${imported}; skipped ${plural(skipped, "entry", "entries")}` : imported;
}

export async function runInit(options: InitOptions): Promise<void> {
  const { configPath, cwd, source } = options;

  let text: string;
  let imported: ReturnType<typeof generateConfigFromDtcg> | undefined;
  let preset: ReturnType<typeof getPreset> | undefined;
  if ("from" in source) {
    imported = generateConfigFromDtcg({ sources: source.from, cwd });
    text = imported.source;
  } else {
    preset = getPreset(source.preset);
    text = preset.source;
  }

  const shownPath = displayPath(cwd, configPath);

  // `writeMode: "once"` checks existsSync() before writing — not perfectly
  // atomic, but avoids inverting control flow through a catch block. `-c` is the
  // user's own choice of destination, so it is not confined to `cwd`.
  const { skipReason } = await writeOutputFile(
    path.basename(configPath),
    text,
    path.dirname(configPath),
    { writeMode: options.force ? "always" : "once" },
  );

  if (skipReason === "exists") {
    exitWithError(`${shownPath} already exists. Use --force to overwrite.`);
    return;
  }

  const logger = createLogger();
  if (skipReason === "unchanged") {
    logger.info(`${shownPath} is already up to date`);
  } else {
    logger.info(
      preset ? `Created ${shownPath} from the "${preset.name}" preset` : `Created ${shownPath}`,
    );
  }
  if (imported) {
    logger.info(describeImport(imported.stats));
    for (const warning of imported.warnings) logger.warn(warning);
  }
  logger.info(
    `Next: add plugins from "recontent/plugins" to ${shownPath}, then run \`recontent build\`.`,
  );
}
