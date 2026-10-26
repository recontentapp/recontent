import type { ComponentInfo, LogLevel } from "@recontentapp/core";
import { loadComponents, loadProject } from "../../../project.js";
import { buildToken, type DocToken } from "../../../plugins/shared/doc-token.js";
import { diagnoseRegistry } from "../../registry-diagnostics.js";
import { exitWithError } from "../../utils/exit.js";
import { displayPath } from "../../utils/fs.js";
import { pathKey } from "@recontentapp/core";
import {
  renderComponents,
  renderErrors,
  renderOverview,
  renderTokens,
  type Format,
  type InspectError,
} from "./render.js";
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
  /** Where the introspection cache is read and written; absent for `--no-cache`. */
  cache?: { version: string };
};

/** Exit code for a request that matches nothing; `1` is for a project that is broken. */
const NO_MATCH = 2;

const numericCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

function print(text: string): void {
  process.stdout.write(`${text}\n`);
}

/** Reports on stderr and, with `--format json`, on stdout where a script reads it. */
function fail(format: Format, errors: InspectError[], exitCode = 1): void {
  exitWithError(errors.map((error) => error.message).join("\nerror: "), exitCode);
  if (format === "json") print(renderErrors(errors));
}

export async function runInspect(options: InspectOptions): Promise<void> {
  const { target, format } = options;
  const project = await loadProject({
    configPath: options.configPath,
    logLevel: options.logLevel,
  });
  const { config, logger } = project;
  const configName = displayPath(options.cwd, options.configPath);

  if (target.kind === "components" && !config.introspection) {
    fail(format, [
      {
        message: `${configName} has no \`introspection\` block. Add \`introspection: { entry: "src/components/index.ts" }\` to defineConfig() to inspect components.`,
      },
    ]);
    return;
  }

  for (const diagnostic of config.diagnostics) logger.warn(diagnostic.message);
  // Before the TS program, which is the slow part: no point waiting for it to report a token error.
  const brokenAliases = diagnoseRegistry(config.registry);
  if (brokenAliases.length > 0) {
    for (const diagnostic of brokenAliases) logger.error(diagnostic.message);
    fail(format, [{ message: `${brokenAliases.length} token error(s) in ${configName}` }]);
    return;
  }

  // Tokens never need a TS program; only look at components when asked.
  let components: ComponentInfo[] | undefined;
  let componentsError: string | undefined;
  if (target.kind !== "tokens" && config.introspection) {
    try {
      components = (await loadComponents(project, { cache: options.cache })).components;
    } catch (error) {
      componentsError = error instanceof Error ? error.message : String(error);
    }
  }
  // The overview is where to start, so it still shows the tokens and says what is wrong with the components.
  if (componentsError !== undefined && target.kind === "components") {
    fail(format, [{ message: componentsError }]);
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
        renderOverview({ config: configName, tokens, themes, components, componentsError }, format),
      );
      return;
    case "tokens": {
      const { selected, errors } = selectTokens(tokens, themes, target);
      if (errors.length > 0) {
        fail(format, errors, NO_MATCH);
        return;
      }
      const summary =
        target.paths.length === 0 && !target.type && !target.theme && !target.deprecated;
      print(renderTokens(selected, { format, themes, theme: target.theme, summary }));
      return;
    }
    case "components": {
      const { selected, errors } = selectComponents(components ?? [], target);
      if (errors.length > 0) {
        fail(format, errors, NO_MATCH);
        return;
      }
      const summary = target.names.length === 0;
      print(renderComponents(selected, { format, summary }));
      return;
    }
  }
}
