---
'@compiled/parcel-transformer': minor
'@compiled/webpack-loader': minor
'@compiled/utils': patch
---

- Set `parserBabelPlugins` to default to `['typescript', 'jsx']`
  - This is already used across different Atlassian codebases.
- Add missing 'babelrc: false' for all internal `parseAsync` calls to Babel. This was already included for `transformFromAstAsync` calls.
