import fs from "node:fs";
import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import type ts from "typescript";
import type { LogLevel } from "../../../logger.js";
import { createSnapshot } from "../../../snapshot/snapshot.js";
import { collectLocalImports } from "../../config-graph.js";
import type { Components, Project } from "../../project.js";
import { displayPath } from "../../utils/fs.js";
import {
  executeInspect,
  loadCheckedProject,
  loadHeadlessSnapshot,
  needsIntrospection,
  tryIntrospection,
  type InspectExecution,
  type InspectTarget,
  type LoadedSnapshot,
} from "../inspect/index.js";
import { createMcpServer } from "./server.js";

export type McpOptions = {
  cwd: string;
  logLevel?: LogLevel;
  version: string;
} & (
  | {
      configPath: string;
      /** Where the introspection cache is read and written; absent for `--no-cache`. */
      cache?: { version: string };
    }
  // A design system's published snapshot, instead of its config.
  | { from: string }
);

function stampOf(files: Iterable<string>): string {
  return [...files]
    .map((file) => {
      const stats = fs.statSync(file, { throwIfNoEntry: false });
      return `${file}:${stats?.mtimeMs}:${stats?.size}`;
    })
    .join("\n");
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

const unavailable = (error: unknown): InspectExecution => ({
  ok: false,
  errors: [{ message: messageOf(error) }],
  exitCode: 1,
});

type LocalState = {
  project: Project;
  configFiles: string[];
  configStamp: string;
  tokens: LoadedSnapshot;
  components?: { loaded: LoadedSnapshot; found?: Components; stamp?: string };
  program?: ts.Program;
};

/**
 * Answers `inspect` requests from memory, until a file the answer was computed
 * from changes: then only what depends on it is loaded again, so editing a
 * component does not reload the config. A project that is broken while being
 * edited answers with an error, and recovers once it is fixed.
 */
function createLocalInspector(
  options: Extract<McpOptions, { configPath: string }>,
): (target: InspectTarget) => Promise<InspectExecution> {
  const { configPath, cwd, logLevel, cache } = options;
  let state: LocalState | undefined;

  async function loadState(): Promise<LocalState> {
    const project = await loadCheckedProject({ configPath, cwd, logLevel });
    const configFiles = [...new Set([...collectLocalImports(configPath), configPath])];
    return {
      project,
      configFiles,
      configStamp: stampOf(configFiles),
      tokens: {
        snapshot: createSnapshot(project.config),
        source: displayPath(cwd, configPath),
        sourceKind: "config",
      },
      // The previous program makes the next one incremental.
      program: state?.program,
    };
  }

  const introspectionStamp = (found: Components) =>
    stampOf([...found.watch, ...found.watch.map((file) => path.dirname(file))]);

  async function loadComponents(current: LocalState): Promise<LoadedSnapshot> {
    const { project, tokens } = current;
    const { components, error } = await tryIntrospection(project, {
      oldProgram: current.program,
      cache,
    });
    if (components?.program) current.program = components.program;
    const loaded: LoadedSnapshot = {
      ...tokens,
      snapshot: createSnapshot(project.config, components?.introspection),
      introspectionError: error,
      warnings: components?.warnings,
    };
    // A failure has no files to wait on: it is tried again with the next request.
    current.components = {
      loaded,
      found: components,
      stamp: components && introspectionStamp(components),
    };
    return loaded;
  }

  return async (target) => {
    try {
      if (!state || stampOf(state.configFiles) !== state.configStamp) state = await loadState();
    } catch (error) {
      // The next request tries again; the program is kept for it.
      state = state && { ...state, configStamp: "" };
      return unavailable(error);
    }
    const current = state;
    let loaded = current.tokens;
    if (needsIntrospection(target) && current.project.config.introspection) {
      const known = current.components;
      loaded =
        known?.found && known.stamp === introspectionStamp(known.found)
          ? known.loaded
          : await loadComponents(current);
    }
    const result = executeInspect(loaded, target, "markdown", false);
    if (result.ok)
      for (const warning of result.warnings) current.project.logger.warn(warning.message);
    return result;
  };
}

/** Reads the published snapshot again when its file changes. */
function createHeadlessInspector(options: Extract<McpOptions, { from: string }>): {
  load: (target: InspectTarget) => Promise<InspectExecution>;
  hasComponents: boolean;
} {
  const { from, cwd } = options;
  // Eagerly, so that a missing package or a bad snapshot stops the server before it serves.
  let { loaded, file } = loadHeadlessSnapshot(from, cwd);
  const hasComponents = loaded.snapshot.components !== undefined;
  let stamp = stampOf([file]);
  let broken: unknown;

  return {
    hasComponents,
    load: async (target) => {
      const current = stampOf([file]);
      if (current !== stamp || broken) {
        stamp = current;
        try {
          ({ loaded, file } = loadHeadlessSnapshot(from, cwd));
          broken = undefined;
        } catch (error) {
          broken = error;
          return unavailable(error);
        }
      }
      return executeInspect(loaded, target, "markdown", false);
    },
  };
}

export async function runMcp(options: McpOptions): Promise<void> {
  let load: (target: InspectTarget) => Promise<InspectExecution>;
  let hasComponents = true;
  if ("from" in options) {
    ({ load, hasComponents } = createHeadlessInspector(options));
  } else {
    if (!fs.statSync(options.configPath, { throwIfNoEntry: false })?.isFile()) {
      throw new Error(`Config file not found: "${options.configPath}".`);
    }
    // Loaded with the first request, so that the handshake never waits for it.
    load = createLocalInspector(options);
  }
  // One request at a time: none runs against a half-reloaded project.
  let queue: Promise<unknown> = Promise.resolve();
  const inspect = (target: InspectTarget) => {
    const result = queue.then(() => load(target));
    queue = result.catch(() => {});
    return result;
  };
  const server = createMcpServer({ version: options.version, inspect, hasComponents });

  // stdout belongs to the protocol: a config that logs must not corrupt it.
  const { log, info } = console;
  console.log = console.info = console.error;
  try {
    await new Promise<void>((resolve, reject) => {
      server.server.onclose = resolve;
      server.server.onerror = (error) => console.error(`error: ${error.message}`);
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
      server.connect(new StdioServerTransport()).catch(reject);
    });
  } finally {
    console.log = log;
    console.info = info;
    await server.close();
  }
}
