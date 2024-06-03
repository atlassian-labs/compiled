---
'@compiled/parcel-transformer': patch
'@compiled/webpack-loader': patch
---

Add missing 'babelrc: false' for all internal `parseAsync` calls to Babel. This was already included for `transformFromAstAsync` calls.
