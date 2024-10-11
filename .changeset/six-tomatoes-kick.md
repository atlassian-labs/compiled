---
'@compiled/parcel-transformer': minor
'@compiled/webpack-loader': minor
'@compiled/eslint-plugin': minor
'@compiled/babel-plugin': minor
'@compiled/codemods': minor
'@compiled/utils': minor
---

Make support for `@atlaskit/css` as a first-class import consistently default. This means the same functionality of parsing JSX pragmas, linting specific imports, and extracting styles should all work from `@compiled/react` and `@atlaskit/css` equally without the `importSources: ['@atlaskit/css']` config we use internally.

This was already the default in about 1/3rd of the code, but not consistent. Now it's consistent and I've cleaned up duplicated import patterns.
