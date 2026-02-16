---
'@compiled/react': patch
'@compiled/vite-plugin': patch
---

Fix #1861 by emitting extensions after bundling @compiled/vite-plugin and @compiled/react packages to fix ESM support.
