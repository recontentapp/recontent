import type { LogLevel } from "@recontentapp/core";
import { loadIntrospection, loadProject } from "../../../project.js";
import { typeClosure } from "../../../introspection/types.js";
import {
  createSnapshot,
  readSnapshot,
  type Introspected,
  type Snapshot,
} from "../../../snapshot.js";
import { diagnoseRegistry } from "../../registry-diagnostics.js";
import { exitWithError } from "../../utils/exit.js";
import { displayPath } from "../../utils/fs.js";
import {
  renderComponents,
  renderErrors,
  renderOverview,
  renderTokens,
  renderTypes,
  type Format,
  type InspectError,
} from "./render.js";
import { selectComponents, selectTokens, selectTypes } from "./select.js";

export type InspectTarget =
  | { kind: "overview" }
  | { kind: "tokens"; paths: string[]; type?: string; theme?: string; deprecated?: boolean }
  | { kind: "components"; names: string[]; deprecated?: boolean }
  | { kind: "types"; names: string[]; deprecated?: boolean };

export type InspectOptions = {
  cwd: string;
  logLevel?: LogLevel;
  format: Format;
  target: InspectTarget;
} & (
  | {
      configPath: string;
      /** Where the introspection cache is read and written; absent for `--no-cache`. */
      cache?: { version: string };
    }
  // A design system's published snapshot, instead of its config.
  | { from: string }
);

/** Exit code for a request that matches nothing; `1` is for a project that is broken. */
const NO_MATCH = 2;

function print(text: string): void {
  process.stdout.write(`${text}\n`);
}

/** Reports on stderr and, with `--format json`, on stdout where a script reads it. */
function fail(format: Format, errors: InspectError[], exitCode = 1): void {
  exitWithError(errors.map((error) => error.message).join("\nerror: "), exitCode);
  if (format === "json") print(renderErrors(errors));
}

/** What the selection and rendering below read: the data, where it came from, and why components are missing. */
type Loaded = { snapshot: Snapshot; source: string; introspectionError?: string };

async function loadLocal(
  options: Extract<InspectOptions, { configPath: string }>,
): Promise<Loaded | undefined> {
  const { target, format } = options;
  const project = await loadProject({
    configPath: options.configPath,
    logLevel: options.logLevel,
  });
  const { config, logger } = project;
  const configName = displayPath(options.cwd, options.configPath);

  if ((target.kind === "components" || target.kind === "types") && !config.introspection) {
    fail(format, [
      {
        message: `${configName} has no \`introspection\` block. Add \`introspection: { entry: "src/components/index.ts" }\` to defineConfig() to inspect components.`,
      },
    ]);
    return undefined;
  }

  for (const diagnostic of config.diagnostics) logger.warn(diagnostic.message);
  // Before the TS program, which is the slow part: no point waiting for it to report a token error.
  const brokenAliases = diagnoseRegistry(config.registry, config.themes);
  if (brokenAliases.length > 0) {
    for (const diagnostic of brokenAliases) logger.error(diagnostic.message);
    fail(format, [{ message: `${brokenAliases.length} token error(s) in ${configName}` }]);
    return undefined;
  }

  // Tokens never need a TS program; only look at components when asked.
  let introspected: Introspected | undefined;
  let introspectionError: string | undefined;
  if (target.kind !== "tokens" && config.introspection) {
    try {
      ({ introspection: introspected } = await loadIntrospection(project, {
        cache: options.cache,
      }));
    } catch (error) {
      introspectionError = error instanceof Error ? error.message : String(error);
    }
  }
  // The overview is where to start, so it still shows the tokens and says what is wrong with the components.
  if (
    introspectionError !== undefined &&
    (target.kind === "components" || target.kind === "types")
  ) {
    fail(format, [{ message: introspectionError }]);
    return undefined;
  }

  return { snapshot: createSnapshot(config, introspected), source: configName, introspectionError };
}

function loadHeadless(options: Extract<InspectOptions, { from: string }>): Loaded | undefined {
  const { target, format } = options;
  let loaded: ReturnType<typeof readSnapshot>;
  try {
    loaded = readSnapshot(options.from, options.cwd);
  } catch (error) {
    fail(format, [{ message: error instanceof Error ? error.message : String(error) }]);
    return undefined;
  }
  const { snapshot, source } = loaded;
  if ((target.kind === "components" || target.kind === "types") && !snapshot.components) {
    fail(format, [
      {
        message: `${source} has no components in its snapshot. Its maintainers need \`introspection\` in their config for the \`inspect()\` plugin to include them.`,
      },
    ]);
    return undefined;
  }
  return { snapshot, source };
}

export async function runInspect(options: InspectOptions): Promise<void> {
  const { target, format } = options;
  const loaded = "from" in options ? loadHeadless(options) : await loadLocal(options);
  if (!loaded) return;
  const { snapshot, source, introspectionError } = loaded;
  const { tokens, themes, components, types } = snapshot;

  switch (target.kind) {
    case "overview":
      print(
        renderOverview(
          { config: source, tokens, themes, components, types, introspectionError },
          format,
        ),
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
      const referenced = typeClosure(
        selected.flatMap((component) => component.references),
        types ?? [],
      );
      print(renderComponents(selected, { format, summary, types: referenced }));
      return;
    }
    case "types": {
      const { selected, errors } = selectTypes(types ?? [], target);
      if (errors.length > 0) {
        fail(format, errors, NO_MATCH);
        return;
      }
      const summary = target.names.length === 0;
      const closure = typeClosure(
        selected.map((type) => type.id),
        types ?? [],
      );
      print(renderTypes(selected, { format, summary, types: closure }));
      return;
    }
  }
}
