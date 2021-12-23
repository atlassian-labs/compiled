---
'@compiled-private/module-a': patch
'@compiled/babel-plugin': patch
'@compiled/codemods': patch
'@compiled/react': patch
'@compiled/webpack-loader': patch
---

Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
