---
'@compiled/eslint-plugin': minor
'@compiled/babel-plugin': patch
'@compiled/react': patch
---

Add detectConflictWithOtherLibraries and onlyRunIfImportingCompiled config options to jsx-pragma ESLint rule. Both are set to true by default, hence the breaking change.

`detectConflictWithOtherLibraries` raises a linting error if `css` or `jsx` is imported from `@emotion/react` (or `@emotion/core`) in the same file
as a Compiled import. Set to true by default.

`onlyRunIfImportingCompiled` sets this rule to only suggest adding the JSX pragma if the `css` or `cssMap` functions are imported from `@compiled/react`, as opposed to whenever the `css` attribute is detected at all. Set to false by default.
