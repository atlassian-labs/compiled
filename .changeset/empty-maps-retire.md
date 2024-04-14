---
'@compiled/babel-plugin': patch
---

Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
