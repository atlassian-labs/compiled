---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/parcel-config': minor
'@compiled/parcel-optimizer': minor
'@compiled/parcel-transformer': minor
'@compiled/parcel-app': patch
'@compiled/parcel-optimizer-test-app': patch
'@compiled/parcel-transformer-test-extract-app': patch
---

Changed the approach of stylesheet extraction on Parcel

- @compiled/parcel-resolver is no longer used
- Use metadata to pass styleRules to optimizer
- Optimizer then collects styleRules, and insert it to output HTML
