---
'@compiled/parcel-transformer': patch
'@compiled/webpack-loader': patch
---

Babel now searches upwards for a project root, and if one is found will use the config will be used. This fixes issues in some monorepo setups.
