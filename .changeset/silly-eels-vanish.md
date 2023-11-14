---
'@compiled/eslint-plugin': minor
---

Add two more configuration options to the `no-css-prop-without-css-function` rule:

- `ignoreIfImported` accepts an array of library names. If specified, rule execution will be skipped for all files that import any of the specified libraries (e.g. `@emotion/react`). By default, this is an empty array.
- `excludeReactComponents` is a boolean that determines whether this rule should skip all React components (as opposed to plain HTML elements). False by default.
