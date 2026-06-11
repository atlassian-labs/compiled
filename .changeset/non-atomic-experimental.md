---
'@compiled/babel-plugin': minor
'@compiled/eslint-plugin': minor
'@compiled/css': minor
'@compiled/react': minor
---

Add experimental `atomic` option to `cssMap` for **internal use only**, use with **extreme caution**.

`atomic` is **not officially supported** and is intentionally omitted from the public `cssMap` type signature. It is not discoverable by external consumers and may change or be removed without notice.

### `@compiled/css`

- Added `NON_ATOMIC_CLASS_PREFIX` constant (`'cc-'`) — the shared prefix for all non-atomic class names.
- Added `atomic` option to `LocalTransformOptions` / `transformCss`. When `atomic: false`, all CSS declarations for a given cssMap variant are emitted under a **single non-atomic class** (prefixed `cc-<hash>`) instead of one atomic class per declaration.
  - This dramatically reduces the number of classes applied to a DOM element for large `cssMap` objects (e.g. editor's 3 000-class map), eliminating the layout-recalculation performance regression caused by excessive class counts.
  - The class name has **no `_` prefix**, so `ax()` treats it as a plain opaque class and does not attempt atomic deduplication on it.
- Added `non-atomicify-rules` PostCSS plugin that wraps all declarations in a single `.cc-<hash> { … }` rule, preserving pseudo-selectors, at-rules (`@media`, `@supports`, `@container`, `@keyframes`, `@property`), nested class selectors, and CSS custom properties.
  - Shares at-rule classification logic (`at-rule-lists.ts`) with `atomicify-rules` as a single source of truth.
- Updated `sortAtomicStyleSheet` to skip sorting for `cc-` prefixed rules, preserving their source-order cascade (non-atomic rules contain multiple declarations per class and must not be reordered by shorthand depth).

### `@compiled/babel-plugin`

- `cssMap` now accepts an optional second argument `{ atomic: false }`, validated at compile time.
  - `atomic` must be a **boolean literal** (not a variable). Non-boolean values throw a build-time error.
  - Unknown option names throw a build-time error.
- The class name for each non-atomic variant is derived from `hash(filename + ':' + variantKey)` — computed once per variant in the Babel plugin, avoiding the need to hash the full CSS content at build time. This is memory-efficient and stable across builds.
- All CSS items for a non-atomic variant are combined into a single sheet string before injection, resulting in exactly one `const _N` variable per variant in the compiled JS output and one `insertNonAtomicRule()` call at runtime (fewer DOM mutations).

### `@compiled/react`

- Added `insertNonAtomicRule()` export to `sheet.ts` — injects a CSS rule directly into the catch-all `''` bucket, bypassing the shorthand-depth bucket sorting used for atomic classes.
- Updated `style.tsx` to detect `cc-` prefixed sheets via `isNonAtomicSheet()` and route them through `insertNonAtomicRule()` instead of `insertRule()`, in both client-side and SSR paths. This ensures non-atomic rules preserve their source-order cascade and are never split across multiple `<style>` buckets.

### `@compiled/eslint-plugin`

- Added `no-css-map-options` ESLint rule to recommended rules to prevent accidental use of experimental `cssMap` options such as `atomic`.
