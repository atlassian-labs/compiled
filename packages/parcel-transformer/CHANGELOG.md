# @compiled/parcel-transformer

## 0.19.0

### Minor Changes

- f9bf2fb: Skip transformed code

## 0.18.7

### Patch Changes

- Updated dependencies [9a66324]
- Updated dependencies [cceffda]
  - @compiled/babel-plugin@0.38.0
  - @compiled/babel-plugin-strip-runtime@0.38.0

## 0.18.6

### Patch Changes

- @compiled/babel-plugin@0.37.1
- @compiled/babel-plugin-strip-runtime@0.37.1

## 0.18.5

### Patch Changes

- Updated dependencies [3d10a6d2]
  - @compiled/babel-plugin@0.37.0

## 0.18.4

### Patch Changes

- Updated dependencies [0f64c39f]
  - @compiled/babel-plugin@0.36.0
  - @compiled/babel-plugin-strip-runtime@0.36.0

## 0.18.3

### Patch Changes

- Updated dependencies [34e5339a]
- Updated dependencies [34e5339a]
  - @compiled/babel-plugin@0.35.0

## 0.18.2

### Patch Changes

- Updated dependencies [0ebbfc15]
  - @compiled/babel-plugin@0.34.0

## 0.18.1

### Patch Changes

- Updated dependencies [88bbe382]
- Updated dependencies [f63b99d4]
  - @compiled/utils@0.13.1
  - @compiled/babel-plugin-strip-runtime@0.33.0
  - @compiled/babel-plugin@0.33.0

## 0.18.0

### Minor Changes

- c1655312: Throw an error when mixing `extract: true` and `classHashPrefix` configuration options to avoid unsupported usage and bundle size bloat.

### Patch Changes

- c1655312: Documents what happens when mixing extraction and classHashPrefix
- Updated dependencies [c1655312]
  - @compiled/babel-plugin@0.32.1

## 0.17.0

### Minor Changes

- 4fb5c6e1: Adds a new option that can be passed to the babel plugin called `classHashPrefix`. Its value is used to add a prefix to the class names when generating their hashes.
- 2750e288: Make support for `@atlaskit/css` as a first-class import consistently default. This means the same functionality of parsing JSX pragmas, linting specific imports, and extracting styles should all work from `@compiled/react` and `@atlaskit/css` equally without the `importSources: ['@atlaskit/css']` config we use internally.

  This was already the default in about 1/3rd of the code, but not consistent. Now it's consistent and I've cleaned up duplicated import patterns.

### Patch Changes

- Updated dependencies [4fb5c6e1]
- Updated dependencies [2750e288]
  - @compiled/babel-plugin@0.32.0
  - @compiled/utils@0.13.0
  - @compiled/babel-plugin-strip-runtime@0.32.0

## 0.16.2

### Patch Changes

- Updated dependencies [9a15e742]
- Updated dependencies [9a15e742]
  - @compiled/babel-plugin-strip-runtime@0.31.0
  - @compiled/utils@0.12.0
  - @compiled/babel-plugin@0.31.0

## 0.16.1

### Patch Changes

- Updated dependencies [83c721d6]
  - @compiled/babel-plugin@0.30.0

## 0.16.0

### Minor Changes

- a0f8c897: - Set `parserBabelPlugins` to default to `['typescript', 'jsx']`
  - This is already used across different Atlassian codebases.
  - Add missing 'babelrc: false' for all internal `parseAsync` calls to Babel. This was already included for `transformFromAstAsync` calls.

### Patch Changes

- Updated dependencies [a0f8c897]
  - @compiled/utils@0.11.2

## 0.15.4

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
- Updated dependencies [4f5865a1]
- Updated dependencies [83c47f85]
  - @compiled/babel-plugin@0.29.0
  - @compiled/babel-plugin-strip-runtime@0.29.0
  - @compiled/utils@0.11.1

## 0.15.3

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0
  - @compiled/babel-plugin@0.28.8
  - @compiled/babel-plugin-strip-runtime@0.28.8

## 0.15.2

### Patch Changes

- Updated dependencies [e49b4f08]
  - @compiled/utils@0.10.0
  - @compiled/babel-plugin@0.28.6
  - @compiled/babel-plugin-strip-runtime@0.28.6

## 0.15.1

### Patch Changes

- 6a606ee8: Check for missing AST in @compiled/parcel-transformer

## 0.15.0

### Minor Changes

- 0666530c: Add new parcel transformer for distributed Compiled code

## 0.14.7

### Patch Changes

- 41bcb1eb: Allow the transformer to bail early if compiled isn't present
- Updated dependencies [7d3406c9]
- Updated dependencies [d5c6578c]
  - @compiled/babel-plugin@0.28.3

## 0.14.6

### Patch Changes

- Updated dependencies [df91c60f]
  - @compiled/babel-plugin-strip-runtime@0.28.0
  - @compiled/babel-plugin@0.28.0

## 0.14.5

### Patch Changes

- Updated dependencies [39714ae3]
  - @compiled/babel-plugin@0.27.1

## 0.14.4

### Patch Changes

- Updated dependencies [db572d43]
  - @compiled/babel-plugin-strip-runtime@0.27.0
  - @compiled/utils@0.9.2

## 0.14.3

### Patch Changes

- Updated dependencies [3bb89ef9]
  - @compiled/babel-plugin-strip-runtime@0.26.2
  - @compiled/utils@0.9.1

## 0.14.2

### Patch Changes

- Updated dependencies [52ea5aba]
- Updated dependencies [9860df38]
  - @compiled/babel-plugin@0.26.0

## 0.14.1

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/babel-plugin-strip-runtime@0.25.0
  - @compiled/utils@0.9.0
  - @compiled/babel-plugin@0.25.0

## 0.14.0

### Minor Changes

- 809cc389: Add resolver configuration option

### Patch Changes

- Updated dependencies [809cc389]
  - @compiled/babel-plugin@0.24.0

## 0.13.4

### Patch Changes

- 9304fa3b: Add extractStylesToDirectory config to support extraction to CSS files
- Updated dependencies [9304fa3b]
  - @compiled/babel-plugin-strip-runtime@0.23.0

## 0.13.3

### Patch Changes

- Updated dependencies [4a2174c5]
  - @compiled/babel-plugin@0.22.0

## 0.13.2

### Patch Changes

- Updated dependencies [487bbd46]
  - @compiled/babel-plugin@0.21.0

## 0.13.1

### Patch Changes

- Updated dependencies [a24c157c]
  - @compiled/babel-plugin@0.20.0

## 0.13.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.
- 89c5d043: Add "classNameCompressionMapFilePath" as an option to Parcel transformer. If both "classNameCompressionMap" and "classNameCompressionMapFilePath" are provided, classNameCompressionMap takes precedence.

### Patch Changes

- Updated dependencies [c4e6b7c0]
- Updated dependencies [c4e6b7c0]
- Updated dependencies [25779e3a]
  - @compiled/babel-plugin@0.19.0
  - @compiled/babel-plugin-strip-runtime@0.19.0
  - @compiled/utils@0.8.0

## 0.12.1

### Patch Changes

- f9c47524: Only invalidate cache on startup when using `.js` config files
  - @compiled/babel-plugin@0.18.1

## 0.12.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12
- f9c957ef: Add an option to compress class names based on "classNameCompressionMap", which is provided by library consumers.
  Add a script to generate compressed class names.

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/babel-plugin@0.18.0
  - @compiled/babel-plugin-strip-runtime@0.18.0
  - @compiled/utils@0.7.0

## 0.11.3

### Patch Changes

- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/babel-plugin@0.17.3
  - @compiled/utils@0.6.17
  - @compiled/babel-plugin-strip-runtime@0.17.3

## 0.11.2

### Patch Changes

- 08a963fc: Bump flowgen types
- Updated dependencies [14f2091b]
- Updated dependencies [50b51724]
- Updated dependencies [08a963fc]
  - @compiled/babel-plugin@0.17.2
  - @compiled/babel-plugin-strip-runtime@0.17.2

## 0.11.1

### Patch Changes

- Updated dependencies [99af4aa0]
  - @compiled/babel-plugin@0.17.1

## 0.11.0

### Minor Changes

- 966a1080: Changed the approach of stylesheet extraction on Parcel

  - @compiled/parcel-resolver is no longer used
  - Pass styleRules to optimizer via metadata
  - Optimizer then collects styleRules, and inserts it to output HTML

### Patch Changes

- Updated dependencies [966a1080]
  - @compiled/babel-plugin-strip-runtime@0.17.0

## 0.10.0

### Minor Changes

- 100f5d5e: Pass a custom resolver from parcel-transformer to babel plugin

### Patch Changes

- Updated dependencies [fcda0097]
- Updated dependencies [dcb333a2]
- Updated dependencies [5ee1a866]
  - @compiled/babel-plugin@0.16.5

## 0.9.1

### Patch Changes

- a7df222: Use parser babel plugins in parcel transformer

## 0.9.0

### Minor Changes

- e1ac2ed: Rename babelPlugins configuration option to parserBabelPlugins and add transformerBabelPlugins option
- e93ed68: Added configurable options to prevent side effects in SSR

### Patch Changes

- Updated dependencies [e1ac2ed]
- Updated dependencies [4f8f2aa]
- Updated dependencies [d3b5fb9]
- Updated dependencies [e93ed68]
  - @compiled/babel-plugin@0.16.0
  - @compiled/babel-plugin-strip-runtime@0.16.0

## 0.8.1

### Patch Changes

- Updated dependencies [0b38c11]
- Updated dependencies [2d24709]
  - @compiled/babel-plugin@0.15.0

## 0.8.0

### Minor Changes

- 5f231e5: Support stylesheet extraction with Parcel

### Patch Changes

- Updated dependencies [5f231e5]
- Updated dependencies [6d6b579]
  - @compiled/babel-plugin-strip-runtime@0.14.1
  - @compiled/babel-plugin@0.14.1

## 0.7.3

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- Updated dependencies [2ad385c]
- Updated dependencies [5e3ad5e]
- Updated dependencies [c96c562]
- Updated dependencies [73821f2]
- Updated dependencies [356b120]
- Updated dependencies [588cd4f]
  - @compiled/babel-plugin@0.14.0
  - @compiled/utils@0.6.16

## 0.7.2

### Patch Changes

- Updated dependencies [307bb83]
- Updated dependencies [18dcdf8]
  - @compiled/babel-plugin@0.13.0

## 0.7.1

### Patch Changes

- 597687c: Bump Parcel to v2.3.2

## 0.7.0

### Minor Changes

- 024ac88: Upgrade parcel transformer to support Parcel v2.2.0

### Patch Changes

- Updated dependencies [b0adb8a]
- Updated dependencies [f139218]
- Updated dependencies [858146c]
- Updated dependencies [b0adb8a]
  - @compiled/babel-plugin@0.12.0

## 0.6.20

### Patch Changes

- c757259: Update type definition dependencies
- Updated dependencies [254a6f6]
- Updated dependencies [c757259]
- Updated dependencies [63148ec]
  - @compiled/babel-plugin@0.11.4

## 0.6.19

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
  - @compiled/babel-plugin@0.11.2
  - @compiled/utils@0.6.13

## 0.6.18

### Patch Changes

- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- Updated dependencies [79cfb08]
- Updated dependencies [14368bb]
- Updated dependencies [68ebac3]
- Updated dependencies [427cead]
- Updated dependencies [79cfb08]
  - @compiled/babel-plugin@0.11.1
  - @compiled/utils@0.6.12

## 0.6.17

### Patch Changes

- Updated dependencies [e015a3a]
- Updated dependencies [fa6af90]
  - @compiled/babel-plugin@0.11.0

## 0.6.16

### Patch Changes

- Updated dependencies [b68411c]
- Updated dependencies [53a3d71]
  - @compiled/babel-plugin@0.10.0

## 0.6.15

### Patch Changes

- Updated dependencies [0b60ae1]
- Updated dependencies [2092839]
  - @compiled/babel-plugin@0.9.0

## 0.6.14

### Patch Changes

- Updated dependencies [53935b3]
  - @compiled/babel-plugin@0.8.0

## 0.6.13

### Patch Changes

- Updated dependencies [bcb2a68]
- Updated dependencies [a7ab8e1]
- Updated dependencies [e1dc346]
- Updated dependencies [48805ec]
- Updated dependencies [587e729]
  - @compiled/babel-plugin@0.7.0

## 0.6.12

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
  - @compiled/babel-plugin@0.6.13
  - @compiled/utils@0.6.11

## 0.6.11

### Patch Changes

- 6a7261e: Programmatic babel use now searches upwards for a project root, and if found will use that config. This fixes issues in some monorepo setups.

## 0.6.10

### Patch Changes

- 37108e4: Compiled dependencies are now using carat range.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/babel-plugin@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [0bb1c11]
  - @compiled/utils@0.6.9
  - @compiled/babel-plugin@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/babel-plugin@0.6.8
  - @compiled/utils@0.6.8
