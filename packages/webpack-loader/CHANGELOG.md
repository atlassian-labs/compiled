# @compiled/webpack-loader

## 0.19.5

### Patch Changes

- Updated dependencies [197512fa]
  - @compiled/css@0.20.0
  - @compiled/babel-plugin@0.37.1
  - @compiled/babel-plugin-strip-runtime@0.37.1

## 0.19.4

### Patch Changes

- Updated dependencies [3d10a6d2]
  - @compiled/babel-plugin@0.37.0

## 0.19.3

### Patch Changes

- Updated dependencies [0f64c39f]
  - @compiled/babel-plugin@0.36.0
  - @compiled/css@0.19.0
  - @compiled/babel-plugin-strip-runtime@0.36.0

## 0.19.2

### Patch Changes

- Updated dependencies [34e5339a]
- Updated dependencies [34e5339a]
  - @compiled/babel-plugin@0.35.0

## 0.19.1

### Patch Changes

- Updated dependencies [0ebbfc15]
  - @compiled/babel-plugin@0.34.0

## 0.19.0

### Minor Changes

- f63b99d4: Possibly BREAKING: Default `sortShorthand` to be enabled during stylesheet extraction to match the config we have internally at Atlassian and our recommendation.

  You can opt-out from this change by setting `sortShorthand: false` in several places, refer to https://compiledcssinjs.com/docs/shorthand and package-specific documentation.

  This is only a breaking change if you expect `margin:0` to override `margin-top:8px` for example, which in other CSS-in-JS libraries may actually work, but in Compiled it's not guaranteed to work, so we forcibly sort it to guarantee the order in which these styles are applied.

### Patch Changes

- Updated dependencies [88bbe382]
- Updated dependencies [f63b99d4]
  - @compiled/utils@0.13.1
  - @compiled/babel-plugin-strip-runtime@0.33.0
  - @compiled/css@0.18.0
  - @compiled/babel-plugin@0.33.0

## 0.18.1

### Patch Changes

- Updated dependencies [9b960009]
  - @compiled/css@0.17.0
  - @compiled/babel-plugin@0.32.2
  - @compiled/babel-plugin-strip-runtime@0.32.2

## 0.18.0

### Minor Changes

- c1655312: Throw an error when mixing `extract: true` and `classHashPrefix` configuration options to avoid unsupported usage and bundle size bloat.

### Patch Changes

- c1655312: Documents what happens when mixing extraction and classHashPrefix
- c1655312: fix: webpack loader wasn't passing classHashPrefix option down to babel plugin
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
  - @compiled/css@0.16.0
  - @compiled/utils@0.13.0
  - @compiled/babel-plugin-strip-runtime@0.32.0

## 0.16.0

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
  - @compiled/babel-plugin-strip-runtime@0.31.0
  - @compiled/utils@0.12.0
  - @compiled/css@0.15.0
  - @compiled/babel-plugin@0.31.0

## 0.15.0

### Minor Changes

- 83c721d6: Modify the early-exit on our Webpack loader to work with `options.importSources` to properly transform other Compiled aliases.

### Patch Changes

- Updated dependencies [83c721d6]
  - @compiled/babel-plugin@0.30.0

## 0.14.1

### Patch Changes

- 8f3149fa: When parsing the Webpack config `rules` option, also handle the situation where a rule might be falsy (null, undefined, 0, "")

## 0.14.0

### Minor Changes

- a0f8c897: - Set `parserBabelPlugins` to default to `['typescript', 'jsx']`
  - This is already used across different Atlassian codebases.
  - Add missing 'babelrc: false' for all internal `parseAsync` calls to Babel. This was already included for `transformFromAstAsync` calls.

### Patch Changes

- Updated dependencies [a0f8c897]
  - @compiled/utils@0.11.2

## 0.13.0

### Minor Changes

- 83c47f85: [BREAKING] Add a deterministic sorting to media queries and other at-rules in Compiled. We use a simplified version of what the [`sort-css-media-queries`](https://github.com/OlehDutchenko/sort-css-media-queries?tab=readme-ov-file#mobile-first) package does - sorting `min-width` and `min-height` from smallest to largest, then `max-width` and `max-height` from largest to smallest. If ranges or features involving `height` and `width` are not present in the at-rule, the at-rule will be sorted lexicographically / alphabetically.

  Situations you may need to be careful of:

  - In situations where two at-rules with the same property apply at the same time, this may break your styles, as the order in which the styles are applied will change. (For example, overlapping `@media` queries)
  - Because all at-rules will now be sorted lexicographically / alphabetically, `@layer` blocks you pass to Compiled APIs may not be outputted in the same order, causing different CSS than expected.

  This is turned on by default. If you do not want your at-rules to be sorted, set `sortAtRules` to `false` in your configuration:

  - Webpack users: the `@compiled/webpack-loader` options in your Webpack configuration
  - Parcel users: your Compiled configuration, e.g. `.compiledcssrc` or similar
  - Babel users: the `@compiled/babel-plugin-strip-runtime` options in your `.babelrc.json` or similar, if you have the `@compiled/babel-plugin-strip-runtime` plugin enabled.

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
- Updated dependencies [4f5865a1]
- Updated dependencies [83c47f85]
  - @compiled/babel-plugin@0.29.0
  - @compiled/babel-plugin-strip-runtime@0.29.0
  - @compiled/utils@0.11.1
  - @compiled/css@0.14.0

## 0.12.7

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0
  - @compiled/css@0.13.0
  - @compiled/babel-plugin@0.28.8
  - @compiled/babel-plugin-strip-runtime@0.28.8

## 0.12.6

### Patch Changes

- Updated dependencies [e49b4f08]
- Updated dependencies [e49b4f08]
  - @compiled/css@0.12.3
  - @compiled/utils@0.10.0
  - @compiled/babel-plugin@0.28.6
  - @compiled/babel-plugin-strip-runtime@0.28.6

## 0.12.5

### Patch Changes

- 8d48ca03: Add `importSources` option to @compiled/webpack-loader

## 0.12.4

### Patch Changes

- Updated dependencies [df91c60f]
  - @compiled/babel-plugin-strip-runtime@0.28.0
  - @compiled/babel-plugin@0.28.0

## 0.12.3

### Patch Changes

- Updated dependencies [39714ae3]
  - @compiled/babel-plugin@0.27.1

## 0.12.2

### Patch Changes

- Updated dependencies [db572d43]
  - @compiled/babel-plugin-strip-runtime@0.27.0
  - @compiled/utils@0.9.2

## 0.12.1

### Patch Changes

- Updated dependencies [3bb89ef9]
  - @compiled/babel-plugin-strip-runtime@0.26.2
  - @compiled/utils@0.9.1

## 0.12.0

### Minor Changes

- 66695a2d: Support resolver module path

## 0.11.8

### Patch Changes

- Updated dependencies [52ea5aba]
- Updated dependencies [9860df38]
  - @compiled/babel-plugin@0.26.0

## 0.11.7

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/babel-plugin-strip-runtime@0.25.0
  - @compiled/utils@0.9.0
  - @compiled/babel-plugin@0.25.0
  - @compiled/css@0.12.1

## 0.11.6

### Patch Changes

- 941a723f: Bugfix: no-css-tagged-template-expression ESLint rule truncates strings which include colons during autofixing.
- Updated dependencies [4a11c5f4]
  - @compiled/babel-plugin@0.24.1

## 0.11.5

### Patch Changes

- Updated dependencies [809cc389]
  - @compiled/babel-plugin@0.24.0

## 0.11.4

### Patch Changes

- 9304fa3b: Add extractStylesToDirectory config to support extraction to CSS files
- Updated dependencies [9304fa3b]
  - @compiled/babel-plugin-strip-runtime@0.23.0

## 0.11.3

### Patch Changes

- Updated dependencies [4a2174c5]
  - @compiled/babel-plugin@0.22.0

## 0.11.2

### Patch Changes

- Updated dependencies [487bbd46]
  - @compiled/babel-plugin@0.21.0

## 0.11.1

### Patch Changes

- Updated dependencies [a24c157c]
  - @compiled/css@0.12.0
  - @compiled/babel-plugin@0.20.0

## 0.11.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

### Patch Changes

- Updated dependencies [c4e6b7c0]
- Updated dependencies [c4e6b7c0]
- Updated dependencies [25779e3a]
  - @compiled/babel-plugin@0.19.0
  - @compiled/babel-plugin-strip-runtime@0.19.0
  - @compiled/utils@0.8.0
  - @compiled/css@0.11.0

## 0.10.1

### Patch Changes

- Updated dependencies [f9005e2b]
- Updated dependencies [488deaa6]
  - @compiled/css@0.10.0
  - @compiled/babel-plugin@0.18.1

## 0.10.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12
- f9c957ef: Add an option to compress class names based on "classNameCompressionMap", which is provided by library consumers.
  Add a script to generate compressed class names.

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/babel-plugin@0.18.0
  - @compiled/babel-plugin-strip-runtime@0.18.0
  - @compiled/css@0.9.0
  - @compiled/utils@0.7.0

## 0.9.8

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/babel-plugin@0.17.3
  - @compiled/css@0.8.8
  - @compiled/utils@0.6.17
  - @compiled/babel-plugin-strip-runtime@0.17.3

## 0.9.7

### Patch Changes

- 33d6621a: Fix error when using @compiled/webpack-loader via a path and with extraction enabled
- Updated dependencies [14f2091b]
- Updated dependencies [50b51724]
- Updated dependencies [08a963fc]
  - @compiled/babel-plugin@0.17.2
  - @compiled/babel-plugin-strip-runtime@0.17.2
  - @compiled/react@0.11.2

## 0.9.6

### Patch Changes

- Updated dependencies [99af4aa0]
- Updated dependencies [8a74fcd7]
  - @compiled/babel-plugin@0.17.1
  - @compiled/css@0.8.6

## 0.9.5

### Patch Changes

- 3cb750ab: Bump loader-utils to 2.0.3

## 0.9.4

### Patch Changes

- Updated dependencies [966a1080]
  - @compiled/babel-plugin-strip-runtime@0.17.0

## 0.9.3

### Patch Changes

- dcb333a2: Use less likely to clash variable names in styled template
- 44d8c58f: Add missing parserBabelPlugins options to webpack loader
- Updated dependencies [fcda0097]
- Updated dependencies [13b71dfb]
- Updated dependencies [dcb333a2]
- Updated dependencies [5ee1a866]
  - @compiled/babel-plugin@0.16.5
  - @compiled/react@0.11.1

## 0.9.2

### Patch Changes

- 5272281a: Add configurable options to optimize CSS
- Updated dependencies [5272281a]
  - @compiled/babel-plugin@0.16.3
  - @compiled/css@0.8.4

## 0.9.1

### Patch Changes

- 6bd1708: Take hashed asset name into consideration when optimizating css asset

## 0.9.0

### Minor Changes

- e1ac2ed: Rename babelPlugins configuration option to parserBabelPlugins and add transformerBabelPlugins option
- e93ed68: Added configurable options to prevent side effects in SSR

### Patch Changes

- ad4d257: Update TypeScript and Flow types to support function calls and resolve incorrect typing
- Updated dependencies [ad4d257]
- Updated dependencies [8384893]
- Updated dependencies [e1ac2ed]
- Updated dependencies [4f8f2aa]
- Updated dependencies [d3b5fb9]
- Updated dependencies [1cab89a]
- Updated dependencies [e93ed68]
  - @compiled/css@0.8.3
  - @compiled/react@0.11.0
  - @compiled/babel-plugin@0.16.0
  - @compiled/babel-plugin-strip-runtime@0.16.0

## 0.8.7

### Patch Changes

- a59a14f: Fix build issue when webpack loader attempts to parse compiled runtime
- Updated dependencies [0b38c11]
- Updated dependencies [2d24709]
  - @compiled/babel-plugin@0.15.0

## 0.8.6

### Patch Changes

- 8f263c2: Account for nested rules in webpack config when setting plugin configured option on compiled webpack loader
- Updated dependencies [5f231e5]
- Updated dependencies [6d6b579]
  - @compiled/babel-plugin-strip-runtime@0.14.1
  - @compiled/babel-plugin@0.14.1

## 0.8.5

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed
- 588cd4f: Adding require statements for atomic css now occurs inside the babel-plugin-strip-runtime plugin
- Updated dependencies [2ad385c]
- Updated dependencies [5e3ad5e]
- Updated dependencies [c96c562]
- Updated dependencies [73821f2]
- Updated dependencies [356b120]
- Updated dependencies [588cd4f]
- Updated dependencies [588cd4f]
  - @compiled/babel-plugin@0.14.0
  - @compiled/babel-plugin-strip-runtime@0.14.0
  - @compiled/css@0.8.2
  - @compiled/react@0.10.4
  - @compiled/utils@0.6.16

## 0.8.4

### Patch Changes

- Updated dependencies [47050f4]
  - @compiled/react@0.10.3

## 0.8.3

### Patch Changes

- Updated dependencies [307bb83]
- Updated dependencies [18dcdf8]
  - @compiled/babel-plugin@0.13.0

## 0.8.2

### Patch Changes

- cb53d88: Update extract.css to be named compiled-css.css

## 0.8.1

### Patch Changes

- 530b52d: Add property to loader options when CompiledExtractPlugin has been set up correctly.
- Updated dependencies [63e14bd]
- Updated dependencies [f2cd347]
  - @compiled/babel-plugin@0.12.1

## 0.8.0

### Minor Changes

- 858146c: Add babel plugins support

### Patch Changes

- Updated dependencies [b0adb8a]
- Updated dependencies [f139218]
- Updated dependencies [858146c]
- Updated dependencies [b0adb8a]
  - @compiled/babel-plugin@0.12.0

## 0.7.6

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- 63148ec: Support file importing in babel plugin and add configuration in loaders
- Updated dependencies [254a6f6]
- Updated dependencies [c757259]
- Updated dependencies [6649528]
- Updated dependencies [63148ec]
  - @compiled/babel-plugin@0.11.4
  - @compiled/react@0.10.2
  - @compiled/babel-plugin-strip-runtime@0.11.4
  - @compiled/css@0.8.1

## 0.7.5

### Patch Changes

- b345bf4: Update dependencies and plugins to use postcss v8
- Updated dependencies [3b7c188]
- Updated dependencies [c2ae4eb]
- Updated dependencies [b345bf4]
  - @compiled/babel-plugin@0.11.3
  - @compiled/css@0.8.0
  - @compiled/utils@0.6.14

## 0.7.4

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
- Updated dependencies [1ca19be]
  - @compiled/babel-plugin@0.11.2
  - @compiled/babel-plugin-strip-runtime@0.11.2
  - @compiled/css@0.7.2
  - @compiled/utils@0.6.13

## 0.7.3

### Patch Changes

- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.
- 79cfb08: Compiled's CSS loader now uses referential equality instead of pathname to determine if it needs to re-order itself from the last to first.
- Updated dependencies [79cfb08]
- Updated dependencies [14368bb]
- Updated dependencies [68ebac3]
- Updated dependencies [427cead]
- Updated dependencies [79cfb08]
  - @compiled/babel-plugin@0.11.1
  - @compiled/babel-plugin-strip-runtime@0.11.1
  - @compiled/css@0.7.1
  - @compiled/utils@0.6.12

## 0.7.2

### Patch Changes

- Updated dependencies [e015a3a]
- Updated dependencies [fa6af90]
  - @compiled/babel-plugin@0.11.0

## 0.7.1

### Patch Changes

- Updated dependencies [b68411c]
- Updated dependencies [53a3d71]
  - @compiled/babel-plugin@0.10.0

## 0.7.0

### Minor Changes

- 0b60ae1: Use webpack resolution and add custom `resolve` override

### Patch Changes

- Updated dependencies [0b60ae1]
- Updated dependencies [2092839]
  - @compiled/babel-plugin@0.9.0

## 0.6.17

### Patch Changes

- Updated dependencies [53935b3]
  - @compiled/babel-plugin@0.8.0

## 0.6.16

### Patch Changes

- Updated dependencies [bcb2a68]
- Updated dependencies [a7ab8e1]
- Updated dependencies [e1dc346]
- Updated dependencies [bcb2a68]
- Updated dependencies [48805ec]
- Updated dependencies [587e729]
  - @compiled/babel-plugin@0.7.0
  - @compiled/css@0.7.0

## 0.6.15

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
- Updated dependencies [1b1c964]
  - @compiled/babel-plugin@0.6.13
  - @compiled/babel-plugin-strip-runtime@0.6.13
  - @compiled/css@0.6.11
  - @compiled/utils@0.6.11

## 0.6.14

### Patch Changes

- ad512ec: Fixed extraction when `!important` styles were found.

## 0.6.13

### Patch Changes

- 6a7261e: Programmatic babel use now searches upwards for a project root, and if found will use that config. This fixes issues in some monorepo setups.
- 8a13ee9: The loader now only errors once when running without the webpack extract plugin.
- Updated dependencies [b92eb6d]
  - @compiled/babel-plugin-strip-runtime@0.6.11

## 0.6.12

### Patch Changes

- 4032cd4: The `importReact` option now correctly defaults to `true`.

## 0.6.11

### Patch Changes

- 37108e4: Fixed webpack 4 flow throwing unexpectedly.
- 37108e4: Added missing babel dependency.
- 37108e4: Fixed css loader entrypoint not making its way to npm.
- 37108e4: Compiled dependencies are now using carat range.
- 37108e4: Fixed bug picking up an unexpected asset during webpack compilation.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/babel-plugin@0.6.10
  - @compiled/css@0.6.10

## 0.6.10

### Patch Changes

- 660309a: Support for webpack 4 has been added, follow the [extraction guide](https://compiledcssinjs.com/docs/css-extraction-webpack) to get started.

## 0.6.9

### Patch Changes

- 0bb1c11: Added new option `extract` with pairing webpack plugin `CompiledExtractPlugin`.
  Configuring them will strip all the runtime from your app and extract all styles to an atomic style sheet.

  For help getting started with this feature read the [CSS extraction guide](https://compiledcssinjs.com/docs/css-extraction-webpack) for webpack.

- Updated dependencies [0bb1c11]
- Updated dependencies [0bb1c11]
  - @compiled/css@0.6.9
  - @compiled/utils@0.6.9
  - @compiled/babel-plugin@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/babel-plugin@0.6.8
