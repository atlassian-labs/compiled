---
'@compiled/react': patch
---

Fix production runtime style wipe when `cssMapScoped` (`.cc-…`) rules are injected after atomic rules.

In production, atomic rules were injected via `sheet.insertRule()` (CSSOM-only — `textContent`
stays empty) while non-atomic `cssMapScoped` rules were appended via `Text.appendData()` on the
SAME catch-all `<style>` element. When a large `.cc-` sheet was later injected (e.g. lazily
mounting the editor), the browser reparsed the sheet from its now-populated text node and
DISCARDED every previously `insertRule`-inserted rule — an observable global style wipe (unstyled
UI on affected surfaces).

Non-atomic `.cc-` rules now live in a dedicated `'cc'` bucket with its own `<style>` element that
`insertRule` never targets. The two insertion strategies can no longer share a DOM node, so the
reparse-wipe is impossible by construction. Source-order cascade for `cssMapScoped` variants is
preserved (append order within the `cc` bucket), and `.cc-` rules still cascade after every
atomic bucket (the `cc` bucket is placed last in `styleBucketOrdering`).

Regression tests in `runtime/__tests__/style.test.tsx` assert:

- Atomic rules previously inserted via `insertRule` remain reachable via `sheet.cssRules` after a
  large `.cc-` non-atomic sheet is later injected.
- `Text.appendData` never mutates a `<style>` element whose sheet already has
  `insertRule`-inserted rules.
