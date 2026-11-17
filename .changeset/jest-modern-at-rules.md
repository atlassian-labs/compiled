---
'@compiled/jest': minor
---

`toHaveCompiledCss` can now match styles inside `@container`, `@supports`, `@layer` and `@starting-style` using the new `container`, `supports`, `layer` and `startingStyle` options. These can be combined with each other and with `media` and `target` for nested at-rules.
