# Recontent.app

Recontent is a design system toolchain which helps engineers & designers.

Recontent is shipped as a command line interface (CLI) which can be executed by humans, agents or CI.

## Verification loop

- Rely on `build`, `typecheck`, `test`, `lint` & `format` scripts at the root level, do not infer technologies used for these tasks

## Taste

- Do not preserve complexity just because it already exists
- Do not introduce machinery because it looks architecturally impressive
- Channel both "measure twice, cut once" and "yagni"

## Testing strategy

- Prefer integration tests which focus on meaningful logic or observable behavior. Test through the highest-level function that still gives precise assertions; don't unit test thin wrappers, constants or type guards that every other test already exercises.
- Assert each behavior once, at the right level:
  - Unit specs own logic and exact messages (diagnostics, suggestions, formatting).
  - CLI e2e specs (`test/cli/**`, through the built binary via `helpers/cli.ts`) own the process contract: exit codes, stdout vs stderr, files written or not. Use one representative case per contract, not every input variant.
  - Golden snapshots (`test/plugins/golden-snapshot.test.ts`) are the regression net for full plugin output. Don't add per-plugin snapshots; plugin specs assert targeted properties the snapshot can't express.
- Before adding a test, search for one that already asserts it. Extend it or add a `test.each` row instead of a near-copy. Only use `test.each` when the rows share one code path.
