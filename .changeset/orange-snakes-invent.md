---
'@compiled/codemods': minor
---

Keep named imports from `styled-components` that are known to be compatible with `@compiled/react` when using the `styled-components-to-compiled` codemod. Currently this only includes the `css` named import.

**Breaking change:** The `buildImport` plugin API has changed. It now passes an array of specifiers to be added to the created import statement instead of just the `defaultSpecifierName` and `namedImport` strings, making it possible to build statements with multiple imports.
