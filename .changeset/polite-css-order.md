---
'@compiled/parcel-optimizer': patch
'@compiled/babel-plugin-strip-runtime': patch
---

Sort assets by filePath for deterministic cross-file ordering. Within each asset, preserve cssMapScoped (non-atomic) rule source order and sort atomic rules lexically.
