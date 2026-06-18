---
'@compiled/parcel-optimizer': patch
'@compiled/babel-plugin-strip-runtime': patch
'@compiled/react': patch
---

Sort assets by filePath for deterministic cross-file ordering. Within each asset, preserve cssMapScoped (non-atomic) rule source order and sort atomic rules lexically. Fix `isNonAtomicSheet` to use `includes` instead of `startsWith` so at-rule-wrapped non-atomic rules (`@media`, `@container`) are correctly bucketed at runtime.
