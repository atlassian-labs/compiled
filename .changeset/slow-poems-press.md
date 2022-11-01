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
- Pass styleRules to optimizer via metadata
- Optimizer then collects styleRules, and inserts it to output HTML
