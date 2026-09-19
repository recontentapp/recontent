# Recontent.app

`recontent` is a CLI for design token tooling: define tokens once in a
`recontent.config.ts`, then generate CSS, vanilla-extract, TypeScript, or
StyleX output from it.

## Commands

```
recontent init                    Scaffold a recontent.config.ts
recontent build [-w]              Run configured plugins and write their output
recontent doctor                  Validate config, registry, and dependencies
recontent diff [rev]              Compare tokens against a git revision (default HEAD)
recontent export html [-o file]   Write a single-file HTML token report
recontent export dtcg [-o dir]    Write tokens.tokens.json + one <theme>.tokens.json per theme
```

## Global options

These apply to every command and must be given before the subcommand name
(e.g. `recontent --cwd apps/web build`, not `recontent build --cwd apps/web`)
— except `-c/--config`, which is deliberately accepted in both positions, so
`recontent build -c recontent.config.ts` also works:

- `-c, --config <path>` — path to the config file. When omitted, `recontent`
  searches upward from `--cwd` for `recontent.config.{ts,mts,js,mjs}`,
  stopping at the filesystem root or the first directory that has a
  `package.json` but no config of its own.
- `--cwd <dir>` — the directory every relative path in the run (config
  discovery, `-o/--output`, plugin output) is resolved against. Defaults to
  the process's own working directory. Use this instead of spawning the CLI
  with a different working directory.
- `--log-level <info|debug>` — defaults to `$RECONTENT_LOG_LEVEL`, then the
  config's own `logLevel`.

## Exit codes

- `0` — success.
- `1` — a `recontent`-reported failure: config/registry validation errors
  (`doctor`), a breaking diff with `--fail-on-breaking`, or a plugin error.
- `2` — a usage error: an unknown command or flag, a missing argument, or
  bare `recontent export` (which lists the available formats instead of
  guessing one).

All human-readable progress goes to stderr; stdout is reserved for command
payloads. `recontent build 1>/dev/null` still shows progress; `2>/dev/null`
is silent on a successful run.

### CI

```yaml
- name: Check tokens for breaking changes
  run: npx recontent diff --fail-on-breaking
```

The step's exit code is the whole contract: `0` means no breaking change,
`1` means a token was removed, renamed, or retyped since the base revision,
and `2` means the invocation itself was wrong (e.g. an unknown flag) rather
than a finding about your tokens.
