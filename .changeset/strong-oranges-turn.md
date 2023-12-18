---
'@compiled/react': patch
---

Fix `cssMap` returned from `createStrictAPI` to return types based on the generic input, fixing usage with the `XCSSProp` API.
