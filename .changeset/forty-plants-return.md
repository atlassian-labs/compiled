---
'@compiled/react': patch
---

use explicit exports from `react/jsx-dev-runtime` and `react/jsx-runtime`. some bundlers, namely vitejs, appear to optimize the need functions away when `export * from` is used
