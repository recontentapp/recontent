import type { Logger, LogLevel } from "../../../logger.js";
import type { IntrospectionWarning } from "../../../introspection/components.js";
import { typeClosure } from "../../../introspection/types.js";
import type { TokenLayer } from "../../../token-model/model.js";
import { loadIntrospection, loadProject, type Components, type Project } from "../../project.js";
import { createSnapshot, readSnapshot, type Snapshot } from "../../../snapshot/snapshot.js";
import { diagnoseRegistry } from "../../../token-model/alias.js";
import { exitWithError } from "../../utils/exit.js";
import { displayPath } from "../../utils/fs.js";
import {
  renderComponents,
  renderErrors,
  renderOverview,
  renderSearch,
  renderTokens,
  renderTypes,
  sharedDeclarations,
  type Format,
  type InspectError,
} from "./render.js";
import {
  searchSnapshot,
  selectComponents,
  selectTokens,
  selectTypes,
  type SearchScope,
} from "./select.js";

export type InspectTarget =
  | { kind: "overview" }
  | {
      kind: "tokens";
      paths: string[];
      layer?: TokenLayer;
      type?: string;
      theme?: string;
      deprecated?: boolean;
    }
  | {
      kind: "components";
      names: string[];
      category?: string;
      deprecated?: boolean;
      props?: string[];
    }
  | { kind: "types"; names: string[]; deprecated?: boolean }
  | { kind: "search"; queries: string[]; scope?: SearchScope[] };

/** Whether answering `target` requires component/type introspection. */
export function needsIntrospection(target: InspectTarget): boolean {
  if (target.kind === "tokens") return false;
  if (target.kind === "search" && target.scope?.length) {
    return target.scope.includes("components") || target.scope.includes("types");
  }
  return true;
}

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
export type LoadedSnapshot = {
  snapshot: Snapshot;
  source: string;
  /** A config, or a published snapshot: the two say differently what to do when components are missing. */
  sourceKind: "config" | "snapshot";
  introspectionError?: string;
  /** What introspecting the project had to say; none from a published snapshot. */
  warnings?: IntrospectionWarning[];
};

export type InspectExecution =
  | { ok: true; output: string; warnings: IntrospectionWarning[] }
  | { ok: false; errors: InspectError[]; exitCode: 1 | 2 };

/**
 * Loads a config and checks its tokens: throws when it is broken, after
 * logging what is wrong with the tokens.
 */
export async function loadCheckedProject(options: {
  configPath: string;
  cwd: string;
  logLevel?: LogLevel;
}): Promise<Project> {
  const project = await loadProject(options);
  const { config, logger } = project;
  for (const diagnostic of config.diagnostics) logger.warn(diagnostic.message);
  // Before the TS program, which is the slow part: no point waiting for it to report a token error.
  const brokenAliases = diagnoseRegistry(config.registry, config.themes);
  if (brokenAliases.length > 0) {
    for (const diagnostic of brokenAliases) logger.error(diagnostic.message);
    throw new Error(
      `${brokenAliases.length} token error(s) in ${displayPath(options.cwd, options.configPath)}`,
    );
  }
  return project;
}

/** Introspection of a project whose config sets `introspection`; a failure is reported as `error`, for the overview to say. */
export async function tryIntrospection(
  project: Project,
  options: Parameters<typeof loadIntrospection>[1],
): Promise<{ components?: Components; error?: string }> {
  try {
    return { components: await loadIntrospection(project, options) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function loadHeadlessSnapshot(
  from: string,
  cwd: string,
): { loaded: LoadedSnapshot; file: string } {
  const { snapshot, source, file } = readSnapshot(from, cwd);
  return { loaded: { snapshot, source, sourceKind: "snapshot" }, file };
}

/** Selects and renders what `target` asks for. Pure: reporting and exit codes are the caller's. */
export function executeInspect(
  loaded: LoadedSnapshot,
  target: InspectTarget,
  format: Format,
  /** Whether markdown output includes `Next:` CLI command hints. */
  hints = true,
): InspectExecution {
  const { snapshot, source, sourceKind, introspectionError, warnings = [] } = loaded;
  const { tokens, themes, components, types } = snapshot;
  const fail = (errors: InspectError[], exitCode: 1 | 2 = NO_MATCH) => ({
    ok: false as const,
    errors,
    exitCode,
  });
  // What was asked for decides which warnings matter: not the other components'.
  const succeed = (
    output: string,
    relevant: (warning: IntrospectionWarning) => boolean = () => true,
  ) => ({ ok: true as const, output, warnings: warnings.filter(relevant) });

  const requiresComponents =
    target.kind === "components" ||
    target.kind === "types" ||
    (target.kind === "search" &&
      Boolean(target.scope?.length) &&
      !target.scope!.includes("tokens"));

  if (requiresComponents) {
    if (introspectionError !== undefined) return fail([{ message: introspectionError }], 1);
    if (!components) {
      return fail(
        [
          {
            message:
              sourceKind === "config"
                ? `${source} has no \`introspection\` block. Add \`introspection: { entry: "src/components/index.ts", importPath: "@acme/ds" }\` to defineConfig() to inspect components.`
                : `${source} has no components in its snapshot. Its maintainers need \`introspection\` in their config for the \`inspect()\` plugin to include them.`,
          },
        ],
        1,
      );
    }
  }

  switch (target.kind) {
    case "overview":
      return succeed(
        renderOverview(
          { config: source, tokens, themes, components, types, introspectionError },
          format,
          hints,
        ),
      );
    case "search": {
      const queries = target.queries.map((query) => query.trim()).filter((query) => query !== "");
      if (queries.length === 0) {
        return fail([{ message: "A search needs at least one query term." }]);
      }
      const output = renderSearch(
        searchSnapshot(
          { tokens, components: components ?? [], types: types ?? [] },
          queries,
          target.scope,
        ),
        { format, queries, themes, hints },
      );
      const result = succeed(output);
      // Tokens are searched even when the components cannot be.
      if (introspectionError !== undefined && needsIntrospection(target))
        result.warnings.unshift({ message: introspectionError });
      return result;
    }
    case "tokens": {
      const { selected, errors } = selectTokens(tokens, themes, target);
      if (errors.length > 0) return fail(errors);
      const summary =
        target.paths.length === 0 &&
        !target.layer &&
        !target.type &&
        !target.theme &&
        !target.deprecated;
      return succeed(
        renderTokens(selected, { format, themes, theme: target.theme, summary, hints }),
      );
    }
    case "components": {
      const { selected, errors } = selectComponents(components ?? [], target);
      if (errors.length > 0) return fail(errors);
      const names = new Set(selected.map((component) => component.name));
      return succeed(
        renderComponents(selected, {
          format,
          summary: target.names.length === 0,
          types: types ?? [],
          shared: sharedDeclarations(components ?? []),
          props: target.props,
          hints,
        }),
        ({ component }) => component === undefined || names.has(component),
      );
    }
    case "types": {
      const { selected, errors } = selectTypes(types ?? [], target);
      if (errors.length > 0) return fail(errors);
      const closure = typeClosure(
        selected.map((type) => type.id),
        types ?? [],
      );
      return succeed(
        renderTypes(selected, {
          format,
          summary: target.names.length === 0,
          types: closure,
          hints,
        }),
        ({ component }) => component === undefined,
      );
    }
  }
}

async function loadLocalSnapshot(
  options: Extract<InspectOptions, { configPath: string }>,
): Promise<{ loaded: LoadedSnapshot; logger: Logger }> {
  const { configPath, cwd, logLevel, target } = options;
  const project = await loadCheckedProject({ configPath, cwd, logLevel });
  const { config, logger } = project;
  // Tokens never need a TS program; only look at components when asked.
  const { components, error } =
    needsIntrospection(target) && config.introspection
      ? await tryIntrospection(project, { cache: options.cache })
      : {};
  return {
    loaded: {
      snapshot: createSnapshot(config, components?.introspection),
      source: displayPath(cwd, configPath),
      sourceKind: "config",
      introspectionError: error,
      warnings: components?.warnings,
    },
    logger,
  };
}

export async function runInspect(options: InspectOptions): Promise<void> {
  const { target, format } = options;
  let loaded: LoadedSnapshot;
  let logger: Logger | undefined;
  try {
    if ("from" in options) ({ loaded } = loadHeadlessSnapshot(options.from, options.cwd));
    else ({ loaded, logger } = await loadLocalSnapshot(options));
  } catch (error) {
    // Rethrown for the CLI to report, with its causes; `--format json` reports on stdout too.
    if (format !== "json") throw error;
    fail(format, [{ message: error instanceof Error ? error.message : String(error) }]);
    return;
  }

  const result = executeInspect(loaded, target, format);
  if (!result.ok) {
    fail(format, result.errors, result.exitCode);
    return;
  }
  for (const warning of result.warnings) logger?.warn(warning.message);
  print(result.output);
}
