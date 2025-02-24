# @compiled/parcel-optimizer

## 0.6.2

### Patch Changes

- Updated dependencies [197512fa]
  - @compiled/css@0.20.0

## 0.6.1

### Patch Changes

- Updated dependencies [0f64c39f]
  - @compiled/css@0.19.0

## 0.6.0

### Minor Changes

- f63b99d4: Possibly BREAKING: Default `sortShorthand` to be enabled during stylesheet extraction to match the config we have internally at Atlassian and our recommendation.

  You can opt-out from this change by setting `sortShorthand: false` in several places, refer to https://compiledcssinjs.com/docs/shorthand and package-specific documentation.

  This is only a breaking change if you expect `margin:0` to override `margin-top:8px` for example, which in other CSS-in-JS libraries may actually work, but in Compiled it's not guaranteed to work, so we forcibly sort it to guarantee the order in which these styles are applied.

### Patch Changes

- Updated dependencies [88bbe382]
- Updated dependencies [f63b99d4]
  - @compiled/utils@0.13.1
  - @compiled/css@0.18.0

## 0.5.2

### Patch Changes

- Updated dependencies [9b960009]
  - @compiled/css@0.17.0

## 0.5.1

### Patch Changes

- Updated dependencies [4fb5c6e1]
- Updated dependencies [2750e288]
  - @compiled/css@0.16.0
  - @compiled/utils@0.13.0

## 0.5.0

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

## 0.4.5

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
- Updated dependencies [83c47f85]
  - @compiled/utils@0.11.1
  - @compiled/css@0.14.0

## 0.4.4

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0
  - @compiled/css@0.13.0

## 0.4.3

### Patch Changes

- Updated dependencies [e49b4f08]
- Updated dependencies [e49b4f08]
  - @compiled/css@0.12.3
  - @compiled/utils@0.10.0

## 0.4.2

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0
  - @compiled/css@0.12.1

## 0.4.1

### Patch Changes

- Updated dependencies [a24c157c]
  - @compiled/css@0.12.0

## 0.4.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0
  - @compiled/css@0.11.0

## 0.3.1

### Patch Changes

- f9c47524: Only invalidate cache on startup when using `.js` config files
- Updated dependencies [f9005e2b]
- Updated dependencies [488deaa6]
  - @compiled/css@0.10.0

## 0.3.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/css@0.9.0
  - @compiled/utils@0.7.0

## 0.2.2

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/css@0.8.8
  - @compiled/utils@0.6.17

## 0.2.1

### Patch Changes

- 08a963fc: Bump flowgen types

## 0.2.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

## 0.1.1

### Patch Changes

- 5f231e5: Support stylesheet extraction with Parcel
