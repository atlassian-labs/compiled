---
'@compiled/babel-plugin-strip-runtime': patch
'@compiled/parcel-transformer': patch
'@compiled/parcel-optimizer': patch
'@compiled/webpack-loader': patch
'@compiled/eslint-plugin': patch
'@compiled/babel-plugin': patch
'@compiled/codemods': patch
'@compiled/utils': patch
'@compiled/jest': patch
'@compiled/css': patch
---

Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
