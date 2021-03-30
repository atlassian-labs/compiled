---
'@compiled/parcel-transformer': patch
'@compiled/webpack-loader': patch
---

Programmatic babel use now searches upwards for a project root, and if found will use that config. This fixes issues in some monorepo setups.
