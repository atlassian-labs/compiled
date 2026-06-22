---
'@compiled/parcel-optimizer': patch
'@compiled/babel-plugin-strip-runtime': patch
'@compiled/webpack-loader': patch
'@compiled/vite-plugin': patch
'@compiled/react': patch
---

Make extracted CSS deterministic and preserve `cssMapScoped` source order across all supported bundlers.

- `@compiled/babel-plugin-strip-runtime`: batch `unshiftContainer` so emitted `require()` statements preserve `styleRules` source order, and partition non-atomic vs atomic rules when writing extracted CSS files via `sortStyleRulesForDeterministicOutput`.
- `@compiled/parcel-optimizer`: collect rules per asset, sort assets by `filePath` for cross-file determinism, then partition non-atomic vs atomic rules.
- `@compiled/vite-plugin`: collect rules per source file (Map keyed by `filePath`), sort by `filePath` for cross-file determinism, then partition.
- `@compiled/webpack-loader`: sort emitted CSS assets by name for deterministic output.
- `@compiled/react`: fix `isNonAtomicSheet` to use `includes` instead of `startsWith` so at-rule-wrapped non-atomic rules (`@media`, `@container`) are correctly bucketed at runtime.
