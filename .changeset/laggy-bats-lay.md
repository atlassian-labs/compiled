---
'@compiled/babel-plugin': patch
---

Promote matching type-only React and forwardRef imports to runtime imports while preserving unrelated type-only specifiers. This prevents missing runtime bindings after TypeScript compilation.
