# @compiled/babel-plugin-strip-runtime

## 0.37.1

### Patch Changes

- Updated dependencies [197512fa]
  - @compiled/css@0.20.0

## 0.36.0

### Patch Changes

- Updated dependencies [0f64c39f]
  - @compiled/css@0.19.0

## 0.33.0

### Minor Changes

- f63b99d4: Possibly BREAKING: Default `sortShorthand` to be enabled during stylesheet extraction to match the config we have internally at Atlassian and our recommendation.

  You can opt-out from this change by setting `sortShorthand: false` in several places, refer to https://compiledcssinjs.com/docs/shorthand and package-specific documentation.

  This is only a breaking change if you expect `margin:0` to override `margin-top:8px` for example, which in other CSS-in-JS libraries may actually work, but in Compiled it's not guaranteed to work, so we forcibly sort it to guarantee the order in which these styles are applied.

### Patch Changes

- Updated dependencies [88bbe382]
- Updated dependencies [f63b99d4]
  - @compiled/utils@0.13.1
  - @compiled/css@0.18.0

## 0.32.2

### Patch Changes

- Updated dependencies [9b960009]
  - @compiled/css@0.17.0

## 0.32.0

### Patch Changes

- Updated dependencies [4fb5c6e1]
- Updated dependencies [2750e288]
  - @compiled/css@0.16.0
  - @compiled/utils@0.13.0

## 0.31.0

### Minor Changes

- 9a15e742: Sort shorthand properties so that they come before longhand properties.

  When using Compiled, one of the following will happen:

  Option 1. If stylesheet extraction is turned off ("runtime mode"): shorthand properties will be sorted before longhand properties, as long as they are not in a pseudo-selector like `:hover` or `:active`. This is enabled by default and cannot be turned off.

  Option 2. If stylesheet extraction is turned on and one of the below is true:

  - You are using Webpack
  - You are using Parcel AND you are running in production mode

  ... shorthand properties will only be sorted if `sortShorthand: true` is passed to `CompiledExtractPlugin` (Webpack), or `sortShorthand: true` is passed to your Compiled config file like `.compiledcssrc` (Parcel). When sorting shorthand properties using this method (option 2), shorthand properties will always be sorted before longhand properties, taking precedence over pseudo-selectors like `:hover` or `:active`.

### Patch Changes

- Updated dependencies [9a15e742]
- Updated dependencies [9a15e742]
  - @compiled/utils@0.12.0
  - @compiled/css@0.15.0

## 0.29.0

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
- Updated dependencies [83c47f85]
  - @compiled/utils@0.11.1
  - @compiled/css@0.14.0

## 0.28.8

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0
  - @compiled/css@0.13.0

## 0.28.6

### Patch Changes

- Updated dependencies [e49b4f08]
- Updated dependencies [e49b4f08]
  - @compiled/css@0.12.3
  - @compiled/utils@0.10.0

## 0.28.0

### Minor Changes

- df91c60f: \[BREAKING\] Fix @compiled/babel-plugin handling of classic JSX pragma. Involves several breaking changes.

  - Move the below @compiled/babel-plugin-strip-runtime behaviour to @compiled/babel-plugin
    - Classic JSX pragma will no longer affect the Babel output: instead of seeing `jsx` function calls in the output, you will see `React.createElement` calls again. (Added to @compiled/babel-plugin-strip-runtime in v0.27.0)
  - @compiled/babel-plugin: Due to the above behaviour change, a classic JSX pragma (`/** @jsx jsx */`) is used, React will always be imported regardless of the value of `importReact`.
  - @compiled/babel-plugin: We don't support specifying the `pragma` option through `@babel/preset-react` or `@babel/plugin-transform-react-jsx` - we will now throw an error if this happens.

## 0.27.0

### Minor Changes

- db572d43: - @compiled/babel-plugin-strip-runtime:
  - Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - The previous version of this PR caused a regression where using the classic JSX pragma `/** @jsx jsx */` with Emotion no longer worked; this is now fixed.
  - @compiled/utils: Add JSX pragma regex (as used by `babel-plugin-transform-react-jsx`) directly to @compiled/utils
  - @compiled/eslint-plugin: Use the official JSX pragma regex `/^\s*\*?\s*@jsx\s+([^\s]+)\s*$/m` instead of `/@jsx (\w+)/`; the former is used in `babel-plugin-transform-react-jsx`

### Patch Changes

- Updated dependencies [db572d43]
  - @compiled/utils@0.9.2

## 0.26.2

### Patch Changes

- 3bb89ef9: Reverting jsx pragma fix which is causing runtime errors
- Updated dependencies [3bb89ef9]
  - @compiled/utils@0.9.1

## 0.25.0

### Minor Changes

- fbc17ed3: - `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
  - `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0
  - @compiled/css@0.12.1

## 0.23.0

### Minor Changes

- 9304fa3b: Add extractStylesToDirectory config to support extraction to CSS files

## 0.19.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0

## 0.18.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
  - @compiled/utils@0.7.0

## 0.17.3

### Patch Changes

- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/utils@0.6.17

## 0.17.2

### Patch Changes

- 08a963fc: Bump flowgen types

## 0.17.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

## 0.16.0

### Minor Changes

- e93ed68: Added configurable options to prevent side effects in SSR

## 0.14.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel

## 0.14.0

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- 588cd4f: Adding require statements for atomic css now occurs inside the babel-plugin-strip-runtime plugin
- Updated dependencies [356b120]
  - @compiled/utils@0.6.16

## 0.11.4

### Patch Changes

- c757259: Update type definition dependencies

## 0.11.2

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.11.1

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.6.13

### Patch Changes

- 40bc0d9: Package descriptions have been updated.

## 0.6.11

### Patch Changes

- b92eb6d: Binding not found error appearing during strip runtime pass has been fixed.

## 0.6.9

### Patch Changes

- 0bb1c11: The `onFoundStyleSheet` option has been replaced by `onFoundStyleSheet`. This callback will be called once with all found styles at the end of the pass.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
