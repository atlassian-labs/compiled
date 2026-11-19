---
'@compiled/babel-plugin': minor
'@compiled/react': minor
---

Support the `@starting-style` at-rule when it is declared directly inside a `cssMap` variant (not nested within another at-rule or selector). Previously it was treated like `@media`, which expects a second half, and produced invalid CSS such as `@starting-style color: blue{}`. The `cssMap` types now accept styles directly under `'@starting-style'`.
