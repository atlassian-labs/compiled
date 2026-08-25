---
'@compiled/react': major
---

Atomic rules are now injected with `sheet.insertRule()` in every environment. Previously only production used the CSSOM; development and test builds appended a text node per rule, which forces the engine to reparse the whole sheet on every insertion.

Two consequences of dev and test now behaving like production:

- **`<style>` elements no longer contain text.** `insertRule` is a CSSOM-only mutation, so `styleElement.textContent` and `document.head.innerHTML` come back empty and the rules must be read off `sheet.cssRules`. Tests asserting on injected CSS via the DOM's text need updating; `toHaveCompiledCss` from `@compiled/jest` handles both sources as of the accompanying patch. In devtools, dev-mode `<style>` tags now render as empty, the same as production — inspect the element's CSSOM to see the rules.
- **Dev no longer diverges from production.** The previous fork meant CSSOM-specific bugs could only surface in production builds; both paths are now identical by construction.
