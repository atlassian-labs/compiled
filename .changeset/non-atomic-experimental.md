---
'@compiled/babel-plugin': minor
'@compiled/eslint-plugin': minor
'@compiled/css': minor
---

Add experimental `atomic` option to `cssMap` for **internal use only**, use with **extreme caution**.

`atomic` is **not officially supported** and is intentionally omitted from the public `cssMap` type signature. It is not discoverable by external consumers and may change or be removed without notice.

### `@compiled/css`

- Added `atomic` option to `LocalTransformOptions` / `transformCss`. When `atomic: false`, all CSS declarations for a given cssMap variant are emitted under a **single non-atomic class** (prefixed `cc-<hash>`) instead of one atomic class per declaration.
  - This dramatically reduces the number of classes applied to a DOM element for large `cssMap` objects (e.g. editor's 3 000-class map), eliminating the layout-recalculation performance regression caused by excessive class counts.
  - The class name has **no `_` prefix**, so `ax()` treats it as a plain opaque class and does not attempt atomic deduplication on it.
- Added `non-atomicify-rules` PostCSS plugin that wraps all declarations in a single `.className { … }` rule, preserving pseudo-selectors and at-rules.

### `@compiled/babel-plugin`

- `cssMap` now accepts an optional second argument `{ atomic: false }`, validated at compile time.
  - `atomic` must be a **boolean literal** (not a variable). Non-boolean values throw a build-time error.
  - Unknown option names throw a build-time error.

### `@compiled/eslint-plugin`

- Added `no-css-map-options` ESLint rule to recommended rules to prevent accidental use of experimental `cssMap` options such as `atomic`.
