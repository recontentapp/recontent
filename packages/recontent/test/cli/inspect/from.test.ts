import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, test } from "@jest/globals";
import {
  copyFixture,
  linkReactTypes,
  makeScratchDir,
  runCli,
  useCliScratch,
} from "../../helpers/cli.js";

useCliScratch();

describe("recontent inspect --from", () => {
  /** The design system, built. */
  function buildSystem(prefix: string): string {
    const system = makeScratchDir(prefix);
    copyFixture("inspect", system);
    linkReactTypes(system);
    expect(runCli(["--cwd", system, "build"]).status).toBe(0);
    return system;
  }

  /** An app that depends on `system` as `@acme/ds`. */
  function installApp(prefix: string, system: string): string {
    const app = makeScratchDir(`${prefix}-app`);
    const installed = path.join(app, "node_modules/@acme/ds");
    mkdirSync(path.join(installed, "dist"), { recursive: true });
    copyFileSync(
      path.join(system, "dist/recontent.json"),
      path.join(installed, "dist/recontent.json"),
    );
    writeFileSync(
      path.join(installed, "package.json"),
      JSON.stringify({ name: "@acme/ds", version: "1.4.0", recontent: "./dist/recontent.json" }),
    );
    return app;
  }

  let system: string;
  let sharedApp: string;
  beforeAll(() => {
    system = buildSystem("inspect-from");
    sharedApp = installApp("inspect-from", system);
  });

  /** An app of its own, for tests that edit what is installed. */
  const freshApp = (prefix: string) => installApp(prefix, system);

  const commands = [
    ["inspect"],
    ["inspect", "tokens", "system.color"],
    ["inspect", "components", "Button"],
    ["inspect", "types"],
    ["inspect", "components", "--format", "json"],
    ["inspect", "--format", "json"],
  ];
  const withoutSource = (output: string) =>
    output.replace(/^(\s*"config": |Config: ).*$/m, "$1<source>");

  test.each(commands)("%s matches a local inspect, via a package and via a file", (...args) => {
    const app = sharedApp;
    const local = runCli(["--cwd", system, ...args]);
    expect(local.status).toBe(0);

    const viaPackage = runCli(["--cwd", app, ...args, "--from", "@acme/ds"]);
    const viaFile = runCli([
      "--cwd",
      app,
      ...args,
      "--from",
      "./node_modules/@acme/ds/dist/recontent.json",
    ]);

    expect(viaPackage.status).toBe(0);
    expect(withoutSource(viaPackage.stdout)).toBe(withoutSource(local.stdout));
    expect(withoutSource(viaFile.stdout)).toBe(withoutSource(local.stdout));
  });

  test("the overview names the package and its version", () => {
    const app = sharedApp;
    const result = runCli(["--cwd", app, "inspect", "--from", "@acme/ds"]);
    expect(result.stdout).toContain("Config: `@acme/ds@1.4.0`");
  });

  test("a snapshot without components can't be asked for them", () => {
    const app = freshApp("inspect-from-tokens-only");
    const file = path.join(app, "node_modules/@acme/ds/dist/recontent.json");
    const snapshot = JSON.parse(readFileSync(file, "utf-8"));
    delete snapshot.components;
    delete snapshot.types;
    writeFileSync(file, JSON.stringify(snapshot));

    expect(runCli(["--cwd", app, "inspect", "tokens", "ref", "--from", "@acme/ds"]).status).toBe(0);
    const result = runCli(["--cwd", app, "inspect", "components", "--from", "@acme/ds"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("has no components in its snapshot");
  });

  test("errors say what to do", () => {
    const app = freshApp("inspect-from-errors");
    const from = (value: string, ...rest: string[]) =>
      runCli(["--cwd", app, "inspect", "--from", value, ...rest]);

    const missing = from("@acme/nope");
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('package "@acme/nope" is not installed');

    mkdirSync(path.join(app, "node_modules/bare"));
    writeFileSync(path.join(app, "node_modules/bare/package.json"), '{ "name": "bare" }');
    const bare = from("bare");
    expect(bare.status).toBe(1);
    expect(bare.stderr).toContain('no "recontent" field');
    expect(bare.stderr).toContain("`inspect()` plugin");

    const snapshot = path.join(app, "node_modules/@acme/ds/dist/recontent.json");
    writeFileSync(
      snapshot,
      readFileSync(snapshot, "utf-8").replace('"schemaVersion": "1"', '"schemaVersion": "2"'),
    );
    const newer = from("@acme/ds");
    expect(newer.status).toBe(1);
    expect(newer.stderr).toContain("Upgrade recontent");
  });

  test("it replaces -c/--config and --no-cache", () => {
    const app = sharedApp;
    for (const flag of [["-c", "recontent.config.ts"], ["--no-cache"]]) {
      const result = runCli(["--cwd", app, "inspect", "--from", "@acme/ds", ...flag]);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("cannot be used with option");
    }
  });

  test("without a config, the error points at --from", () => {
    const app = sharedApp;
    const result = runCli(["--cwd", app, "inspect"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("--from <package|file>");
  });

  test("build --check fails when the published snapshot is stale", () => {
    const system = buildSystem("inspect-from-stale");
    expect(runCli(["--cwd", system, "build", "--check"]).status).toBe(0);
    // Nothing in it depends on the installed recontent, so an upgrade cannot make it stale.
    expect(readFileSync(path.join(system, "dist/recontent.json"), "utf-8")).not.toContain(
      '"recontent"',
    );

    const button = path.join(system, "src/button.tsx");
    writeFileSync(button, readFileSync(button, "utf-8").replace("  icon?: IconName;\n", ""));
    const result = runCli(["--cwd", system, "build", "--check"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("recontent.json");
  });
});
