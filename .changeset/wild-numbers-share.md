---
'@compiled/babel-plugin': patch
---

Resolve an issue where cssMap was being defined after its consumer, which relies on the xcss prop.
