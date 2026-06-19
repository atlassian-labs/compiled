---
'@compiled/parcel-optimizer': patch
'@compiled/babel-plugin-strip-runtime': patch
'@compiled/webpack-loader': patch
'@compiled/react': patch
---

Make extracted CSS deterministic and preserve `cssMapScoped` source order:

- `@compiled/parcel-optimizer`: sort assets by `filePath` for deterministic cross-file ordering. Within each asset, preserve cssMapScoped (non-atomic) rule source order and sort atomic rules lexically.
- `@compiled/babel-plugin-strip-runtime`: apply the same atomic/non-atomic partitioning when writing extracted CSS files, so non-atomic rules preserve their source order within a single asset.
- `@compiled/webpack-loader`: re-order cssMapScoped (non-atomic) rules in the merged CSS so they appear in source order at the top. mini-css-extract-plugin merges `.compiled.css` modules in a dependency order that can reverse the source order of non-atomic rules, breaking the cascade for cssMapScoped overrides.
- `@compiled/react`: fix `isNonAtomicSheet` to use `includes` instead of `startsWith` so at-rule-wrapped non-atomic rules (`@media`, `@container`) are correctly bucketed at runtime.
