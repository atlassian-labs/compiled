---
'@compiled/jest': minor
---

`toHaveCompiledCss` now reads rules back off the stylesheet (`sheet.cssRules`) when a `<style>` element has no text content. The browser runtime injects rules with `sheet.insertRule()`, a CSSOM-only mutation that leaves `textContent` empty, so the matcher previously found no styles to match against. Server-rendered styles and non-atomic `cssMapScoped` rules still live in a text node and are read from there as before.
