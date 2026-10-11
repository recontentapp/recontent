# Recontent.app

Recontent is a design system toolchain which helps engineers & designers manage design tokens and bootstrap design systems faster with pre-built components.

Recontent is shipped as a command line interface (CLI) which can be executed by humans, agents or CI.

## Verification loop

- Rely on `build`, `typecheck`, `test`, `lint` & `format` scripts at the root level, do not infer technologies used for these tasks
- Prefer integration tests which focus on meaningful logic or observable behavior

## Taste

- Do not preserve complexity just because it already exists
- Do not introduce machinery because it looks architecturally impressive
- Channel both "measure twice, cut once" and "yagni"
