---
'@compiled/vite-plugin': patch
'@compiled/babel-plugin-strip-runtime': patch
---

Combine and sort active extracted and local Compiled styles across Vite development modules so cross-file cascade ordering matches production. Allow the Vite plugin to opt into React `jsxDEV` handling when stripping local development runtime styles.
