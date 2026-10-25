import type { LogLevel } from "@recontentapp/core";
import { loadProject } from "../../../project.js";
import { buildToken, type DocToken } from "../../../plugins/shared/doc-token.js";
import { diagnoseRegistry } from "../../registry-diagnostics.js";
import { exitWithError } from "../../utils/exit.js";
import { displayPath } from "../../utils/fs.js";
import { pathKey } from "@recontentapp/core";
import { renderComponents, renderOverview, renderTokens, type Format } from "./render.js";
import { selectComponents, selectTokens } from "./select.js";

export type InspectTarget =
  | { kind: "overview" }
  | { kind: "tokens"; paths: string[]; type?: string; theme?: string; deprecated?: boolean }
  | { kind: "components"; names: string[]; deprecated?: boolean };

export type InspectOptions = {
  cwd: string;
  configPath: string;
  logLevel?: LogLevel;
  format: Format;
  target: InspectTarget;
};

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function print(text: string): void {
  process.stdout.write(`${text}\n`);
}

export async function runInspect(options: InspectOptions): Promise<void> {
  const { target, format } = options;
  const project = await loadProject({
    configPath: options.configPath,
    logLevel: options.logLevel,
    // Tokens never need a TS program; only look at components when asked.
    components: target.kind !== "tokens",
  });
  const { config, logger, components, git } = project;
  const configName = displayPath(options.cwd, options.configPath);

  if (target.kind === "components" && !config.introspection) {
    exitWithError(
      `${configName} has no \`introspection\` block. Add \`introspection: { entry: "src/components/index.ts" }\` to defineConfig() to inspect components.`,
    );
    return;
  }

  for (const diagnostic of config.diagnostics) logger.warn(diagnostic.message);
  const brokenAliases = diagnoseRegistry(config.registry);
  if (brokenAliases.length > 0) {
    for (const diagnostic of brokenAliases) logger.error(diagnostic.message);
    exitWithError(`${brokenAliases.length} token error(s) in ${configName}`);
    return;
  }

  const themes = Object.keys(config.themes);
  const tokens: DocToken[] = [...config.registry.values()]
    .sort((a, b) => numericCompare(pathKey(a.path), pathKey(b.path)))
    .map((entry) =>
      buildToken({ registry: config.registry, themes: config.themes }, entry, themes),
    );

  switch (target.kind) {
    case "overview":
      print(
        renderOverview(
          { config: configName, tokens, themes, components: components?.components, git },
          format,
        ),
      );
      return;
    case "tokens": {
      const { selected, errors } = selectTokens(tokens, themes, target);
      if (errors.length > 0) {
        exitWithError(errors.join("\nerror: "));
        return;
      }
      const summary =
        target.paths.length === 0 && !target.type && !target.theme && !target.deprecated;
      print(renderTokens(selected, { format, themes, theme: target.theme, summary }));
      return;
    }
    case "components": {
      const { selected, errors } = selectComponents(components?.components ?? [], target);
      if (errors.length > 0) {
        exitWithError(errors.join("\nerror: "));
        return;
      }
      const summary = target.names.length === 0;
      print(renderComponents(selected, { format, git, summary }));
      return;
    }
  }
}
