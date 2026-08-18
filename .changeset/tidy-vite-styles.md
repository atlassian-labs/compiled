---
'@compiled/vite-plugin': patch
'@compiled/babel-plugin-strip-runtime': patch
---

Combine and sort active extracted and local Compiled styles across Vite development modules so cross-file cascade ordering matches production. Support React's `jsxDEV` output when stripping local development runtime styles.
