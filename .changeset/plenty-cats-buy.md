---
'@compiled/eslint-plugin': patch
---

Replace context.sourceCode with context.getSourceCode(), to restore compatibility with ESLint v7 and <v8.40.0
