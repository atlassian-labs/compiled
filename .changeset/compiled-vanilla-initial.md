---
'@compiled/vanilla': minor
'@compiled/babel-plugin': minor
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/utils': minor
'@compiled/react': minor
---

`@compiled/react/runtime` now also exports `insertRule`, the bucket-ordered
style insertion helper. This was previously only reachable via the deep
private path `@compiled/react/runtime/sheet`. Promoting it to the public
runtime entry lets framework-agnostic packages (`@compiled/vanilla`) reuse
the same insertion logic so vanilla- and React-emitted rules cohabit the
same `<style>` buckets in `document.head`.

---

Add `@compiled/vanilla`, a framework-agnostic compile-time CSS-in-JS API for
non-React code paths (e.g. ProseMirror node views, plain DOM utilities).

The new package exposes a minimal surface — `cssMap` and `ax` — and is wired
through the existing Babel plugin via a new `state.isVanilla` code path:

- A new `COMPILED_VANILLA_IMPORT = '@compiled/vanilla'` constant in
  `@compiled/utils` is added to `DEFAULT_IMPORT_SOURCES`.
- `@compiled/babel-plugin` detects the import source, omits the React /
  `forwardRef` imports, switches the runtime entry to
  `@compiled/vanilla/runtime`, and emits an `insertSheets([...])` call after
  every transformed `cssMap` so the generated atomic sheets are inserted into
  the document head at module-load time.
- `@compiled/babel-plugin-strip-runtime` recognises and removes
  `insertSheets(...)` calls during extraction, hoisting their string-literal
  rules into the same `styleRules` collection used by `<CC><CS>` so the
  existing `.compiled.css` extraction pipeline applies unchanged. The name
  intentionally avoids `injectGlobal` to leave that name available for a
  future API that injects genuinely unscoped global CSS, matching the
  ecosystem-wide meaning of `injectGlobal` in Emotion / styled-components.
