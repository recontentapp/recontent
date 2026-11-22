# Recontent Documentation Style Guide

This guide defines the writing rules for `apps/docs/src/pages/`. It adapts ASD-STE100 principles to Recontent's vocabulary and Vocs Markdown conventions.

## Sentences

- Keep instructions to at most 25 words.
- Keep descriptions to at most 30 words.
- Keep paragraphs to at most 6 sentences.
- Cover one topic per sentence. Split compound sentences.
- Use the imperative mood for instructions (`Run recontent build.`).
- Use active voice and simple present tense (`recontent diff compares…`, not `Tokens are compared…`).
- Place warnings before the step they apply to, using `:::warning`.
- Put multi-step procedures in numbered lists with one action per step.

## Words

- Use one term per meaning. Follow the Glossary below.
- Use `must` for mandatory conditions. Never use `should`.
- Avoid phrasal verbs (`set up` -> `configure`, `pick up` -> `detect` or `read`, `turn on` -> `enable`, `look up` -> `find`).
- Avoid Latin abbreviations (`e.g.` -> `for example`, `i.e.` -> `that is`, `etc.`).
- Do not use filler words: `simply`, `just`, `easily`, `utilize`, `utilise`, `in order to`, `leverage`, `very`.
- Use US English spelling (`color`, not `colour`).
- Wrap technical identifiers (flags, keys, token paths, file names) in `` `code` ``.

## Layout

- Start every page with 1–2 sentences stating what the page covers.
- Use a bullet list or table for three or more parallel items. Keep table cells concise.
- Use sentence case in headings.
- Give every fenced code block a language identifier (`ts`, `tsx`, `bash`, `css`, `json`, `yaml`, `md`, `text`).
- Show real output from the current CLI build.

## Glossary

| Term          | Meaning                                                                        | Do not use                           |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| config file   | `recontent.config.ts` (or `.mts`, `.js`, `.mjs`).                              | configuration (for the file)         |
| token         | A named design value created with `tokens.*` or stamped in a layer.            | variable (for a token), design value |
| layer         | One of the three token tiers: `ref`, `system`, or `components`.                | tier, level                          |
| alias         | A token whose value points to another token.                                   | pointer, link (for an alias)         |
| theme         | A named set of overrides created with `defineTheme`.                           | mode (for a token theme)             |
| scale         | A typed group of tokens created with `tokens.*Scale()`.                        | ramp, palette (for the API type)     |
| plugin        | A function returning a `RecontentPlugin` that validates or emits files.        | generator, exporter, extension       |
| CSS variable  | A CSS custom property (`--system-color-accent`).                               | CSS custom property                  |
| component     | An introspected React component exported from `introspection.entry`.           | widget, element                      |
| snapshot      | The `recontent.json` file emitted by `inspect()` and read by `inspect --from`. | manifest, bundle                     |
| introspection | Reading React components, props, types, and JSDoc with TypeScript.             | extraction, scanning                 |
