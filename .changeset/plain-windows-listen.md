---
'@compiled/react': patch
'@compiled/jest': patch
---

Fix `toHaveCompiledCss` in @compiled/jest crashing on SVG elements due to lack of className property and expands tests in `@compiled/react`.
