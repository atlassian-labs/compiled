---
'@compiled/babel-plugin-strip-runtime': minor
'@compiled/parcel-optimizer': minor
'@compiled/webpack-loader': minor
'@compiled/react': minor
'@compiled/utils': minor
'@compiled/ssr-app': minor
'@compiled/css': minor
---

Sort shorthand properties so that they come before longhand properties.

When using Compiled, one of the following will happen:

Option 1. If stylesheet extraction is turned off ("runtime mode"): shorthand properties will be sorted before longhand properties, as long as they are not in a pseudo-selector like `:hover` or `:active`. This is enabled by default and cannot be turned off.

Option 2. If stylesheet extraction is turned on and one of the below is true:

- You are using Webpack
- You are using Parcel AND you are running in production mode

... shorthand properties will only be sorted if `sortShorthand: true` is passed to `CompiledExtractPlugin` (Webpack), or `sortShorthand: true` is passed to your Compiled config file like `.compiledcssrc` (Parcel). When sorting shorthand properties using this method (option 2), shorthand properties will always be sorted before longhand properties, taking precedence over pseudo-selectors like `:hover` or `:active`.
