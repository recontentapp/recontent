┌─────┬─────────────┬─────────┬────────┬───────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ID │ Area │ Sev │ Effort │ Finding │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S1 │ Security │ Med │ S │ $description containing */ breaks out of the CSS comment (verified) │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S2 │ Security │ Med │ S │ Unvalidated values go raw into CSS: fontFamily, gradient angle, NaN (verified) │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S3 │ Security │ Med │ XS │ init --from filename injects code into the generated config (verified) │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S4 │ Security │ Low │ XS │ **proto** token names are silently dropped and bypass the reserved-name check (verified) │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S5 │ Security │ Low │ XS │ Markdown docs output doesn't escape titles, labels or theme names │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ S6 │ Security │ Info │ XS │ Output paths aren't confined to the config directory │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ B1 │ Bug │ Med │ S │ A group with a child token named value loses its siblings (verified) │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ P1 │ Perf │ Low–Med │ XS │ Every build rewrites unchanged output files │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ P2 │ Perf │ Low │ XS │ Generated useBreakpoint calls matchMedia() on every snapshot │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────────────────────────────────┤
│ P3 │ Perf │ Low │ XS │ Docs HTML duplicates values per token and re-parses JSON on each theme switch │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ P4 │ Perf │ Low │ XS │ DTCG loader reads and parses each file twice │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D1 │ Duplication │ Med │ M │ Alias walking and cycle detection reimplemented 5 times │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D2 │ Duplication │ Low │ S │ resolveVariableReference / resolveMemberReference copied between stylex and vanilla-extract │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D3 │ Duplication │ Low │ S │ define.ts: metadata spread ×4, raw/stamped registry.set ×2, depth guard ×2 │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D4 │ Duplication │ Low │ XS │ Small helpers copied: roundTo ×2, CONTROL_CHAR_RE ×2, capitalizeSegment ×2, code() ×2 │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D5 │ Duplication │ Low │ S │ Alias block repeated in theme-source.ts; compositeMembers and expandedMembers parallel each other │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ D6 │ Duplication │ Info │ L │ 53 component templates repeat boilerplate lines 25–50× │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ Y1 │ Dead code │ Low │ XS │ outputPlugin's dependencies callback is never read │
├─────┼─────────────┼─────────┼────────┼───────────────────────────────────────────────────────────────────────┤
│ Y2 │ Dead code │ Med │ S │ resolve.installCommand can't fire in its main use case (verified) │
└─────┴─────────────┴─────────┴────────┴───────────────────────────────────────────────────────────────────────┘

Security

S1: CSS comment breakout (plugins/css.ts, formatRule)

- A description of x _/ body{display:none} /_ yields live CSS: /* x _/ body{display:none} /_ */.
- docs/html.ts works around this with withoutDescriptions(), but tailwind.ts also uses formatRule and has no such workaround.
- Fix: escape */ in formatRule and delete the workaround.

S2: Raw values in CSS (tokens.ts, serialize/values.ts)

- tokens.fontFamily only rejects control characters, so Arial; } body{display:none} :root{--x:1 is emitted verbatim.
- gradient({ angle }) is interpolated unvalidated: linear-gradient(0deg); } body{…}.
- tokens.number(NaN) and tokens.fontWeight(NaN) emit NaN (the 1..1000 range check passes NaN).
- By reading only, I also see no runtime check on color alpha or on cubicBezier values.
- This matters most for DTCG imports, since convert.ts funnels untrusted data through these same factories.
- Fix: validate in the factories (a fontFamily allow-list, an angle regex, Number.isFinite).

S3: Filename injection into the generated config (dtcg-import/emit.ts, header comment)

- A token file named x\nglobalThis.PWNED=1;…\n…tokens.json makes line 3 of recontent.config.ts an executable statement.
- recontent build then runs it. Git allows such filenames, so init --from <cloned-dir> is the exposure.
- Fix: JSON.stringify the filename, or strip control characters.
- The rest of the converter escaping held up.

S4: **proto** token names (define.ts, walkAndStamp)

- result["**proto**"] = … sets the prototype instead of an own property, so the reserved-name check in collectEntries never sees it.
- With a JSON-sourced key, the whole tree was misread as a single token at path ref.
- init --from drops a **proto** token without any warning, while constructor gets a "renamed" warning.

S5: Markdown escaping (docs/markdown.ts)

- model.title, group.label, theme names in table headers and scale descriptions aren't escaped. Impact is limited to a malformed doc.

S6: Output path confinement (writeOutputFile, outputPlugin)

- outDir, filename and Tailwind's layer aren't confined or validated. The config is trusted code, so this is informational, and a startsWith(baseDir) check is cheap.

These were solid: DTCG escapeString and quoting, HTML escaping, and the git handling in diff (--end-of-options, the ancestor check, tar --no-same-owner).

Bug found while probing

B1: value key collision (ts-source.ts, setTreeValue uses "value" in child)

- With tokens size.value and size.large, the TypeScript output contains only "large".
- typescript-native shares this code path.
- Fix: use a distinct sentinel key, or a class or tag for leaf nodes.

Performance

- P1: writeOutputFile always calls writeFile. In --watch this touches every generated file, which triggers HMR in Vite and similar tools. Fix: read and compare first, then skip if identical.
- P2: The use-breakpoint.ts template builds new MediaQueryList objects in getSnapshot and subscribeAll. Fix: create them lazily and cache them.
- P3: docs/html.ts writes data-values JSON on every token, and the theme switch does querySelectorAll plus JSON.parse per element. This only matters for thousands of tokens.
- P4: loadSources runs isResolver(file, readJson(file)) and then re-reads the file. Fix: cache the parsed JSON.

Duplication

- D1: Alias chain walking with cycle and missing-target checks exists in registry-diagnostics.ts, ts-source.ts (resolveEntryValue), theme-source.ts (resolveAliasCandidate), shared/alias.ts (terminalEntry) and stylex.ts (topologicalEntries). "Alias target not found" is thrown at about 14 sites. One shared getEntry or walkAliasChain in core would replace most of them.
- D2–D5: The details are in the overview table. All are small, mechanical consolidations.
- D6: The templates already share shared.ts. I'd leave them alone unless you plan more components.

Dead or speculative code

These fall under the "do not introduce machinery" guidance in AGENTS.md.

- Y1: Stylex and vanilla-extract pass a dependencies callback to outputPlugin, which attaches it to the plugin. Nothing reads it, and it isn't on RecontentPlugin.
- Y2: ensureDependencies needs the loaded config's resolve, but loadConfig throws first when recontent can't be resolved. In a directory with no node_modules I got Could not resolve "recontent" and installCommand never ran. Either run the install before loading, or delete the feature and its shell: true exec.
