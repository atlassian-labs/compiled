---
'@compiled/babel-plugin': minor
'@compiled/eslint-plugin': minor
'@compiled/css': minor
'@compiled/react': minor
---

Introduces `cssMapScoped` — a new **experimental internal** API that produces non-atomic CSS output. It is intentionally not exported from the public `@compiled/react` TypeScript types. Consumers must use `@ts-expect-error` to import it and should only do so with explicit approval from the Compiled team.

### Why `cssMapScoped`?

Atomic CSS generates one class per declaration, which is optimal for most components. However, for large style objects with many nested selectors (e.g. rich text editor styles with 3,000+ atomic classes), atomic output causes excessive DOM class counts that trigger layout-recalculation performance regressions.

`cssMapScoped` produces the same class-per-variant model as traditional BEM/CSS Modules, while retaining all Compiled benefits: static extraction, SSR support, and zero runtime overhead.

### Output

Instead of splitting each declaration into its own atomic `_xxx` class, `cssMapScoped` groups all declarations for a variant under a single `cc-<hash>` class:

```tsx
import { cssMapScoped } from '@compiled/react';

const styles = cssMapScoped({
  panelStyles: {
    '.panel': { padding: '8px', backgroundColor: 'blue' },
    '.panel-title': { fontWeight: 'bold', color: 'blue' },
  },
  dangerStyles: {
    '.panel': { backgroundColor: 'pink' },
    '.panel-title': { color: 'red' },
  },
});

// Usage — identical to cssMap:
<div css={[styles.panelStyles, isDanger && styles.dangerStyles]} />;
// Renders: <div class="cc-2ax5o6 cc-oljnhh"> (2 classes, not 8+ atomic classes)
```

### `@compiled/css`

- Added `NON_ATOMIC_CLASS_PREFIX` constant (`'cc-'`) — the class prefix for all non-atomic variant classes.
- Added `nonAtomic` option to `LocalTransformOptions` / `transformCss`. When `nonAtomic: true`, all CSS declarations for a variant are emitted under a single `cc-<hash>` class instead of individual atomic classes. The `cc-` prefix means `ax()` treats these as opaque strings and skips atomic deduplication.
- Added `non-atomicify-rules.ts` PostCSS plugin that scopes all declarations under a single `.cc-<hash>` rule, supporting: pseudo-selectors, at-rules (`@media`, `@supports`, `@container`, `@keyframes`, `@property`), nested class selectors, and CSS custom properties.
- Shared at-rule classification logic (`at-rule-lists.ts`) between `atomicify-rules` and `non-atomicify-rules` as a single source of truth.
- Updated `sortAtomicStyleSheet` to skip reordering `cc-` prefixed rules, preserving their source-order cascade (non-atomic rules contain multiple declarations and must not be sorted by shorthand depth).

### `@compiled/babel-plugin`

- Added `cssMapScoped` as a known Compiled API — registered in the import tracker and Babel visitor.
- `cssMapScoped` always produces non-atomic output. It does not accept a second argument (the `no-css-map-scoped` ESLint rule enforces this).
- The class name for each non-atomic variant is derived from `hash(relative(filename) + ':' + variableName + ':' + variantKey)` — mirroring CSS Modules' approach. Computed once in the Babel plugin (no full-CSS hashing). Stable and deterministic across CI and local builds since `relative(filename)` is resolved from the project root.
- All CSS items for a non-atomic variant are combined into a single sheet string, resulting in exactly one `const _N` variable per variant in the compiled JS output and one `insertNonAtomicRule()` call at runtime.

### `@compiled/react`

- Added `insertNonAtomicRule()` to `sheet.ts` — injects a CSS rule directly into the catch-all `''` bucket, bypassing the shorthand-depth bucket sorting used for atomic rules.
- Updated `style.tsx` to detect `cc-` prefixed sheets via `isNonAtomicSheet()` and route them through `insertNonAtomicRule()` instead of `insertRule()`, in both client-side and SSR paths. This ensures non-atomic rules preserve their source-order cascade and are never split across multiple `<style>` buckets.

### `@compiled/eslint-plugin`

- Replaced `no-css-map-options` rule with `no-css-map-scoped` rule. The new rule flags **any use of `cssMapScoped`**, making it visible during code review and signalling that explicit Compiled team approval is required.
