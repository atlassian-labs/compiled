---
'@compiled/webpack-loader': patch
---

Compiled's CSS loader now uses referential equality instead of pathname to determine if it needs to re-order itself from the last to first.
