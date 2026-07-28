# @compiled/utils

## 0.14.0

### Minor Changes

- b0dacb1: Add an opt-in `collisionResistantHash` option that generates atomic class names using a base-62,
  full-width hash to eliminate hash collisions. **Default behaviour is unchanged** — you must opt in.

  Atomic class names use a base-36 encoding truncated to 4 characters per hash segment
  (`_<group><value>`). This truncation has a severely constrained effective hash space due to leading-digit bias, and has a
  strong leading-character bias, causing class name collisions in large applications that can result
  in `ax()` silently dropping styles.

  Setting `collisionResistantHash: true` (a babel plugin / transform option) switches to a base-62
  encoding of the full 32-bit MurmurHash2 value:

  - **Group hash**: 6 characters (base-62 covers the full 32-bit space with no truncation)
  - **Value hash**: 4 characters (fixed width)
  - Atomic class names change from 9 characters (`_1e0c1ule`) to 11 characters (`_3iDTPbvLZJ`)

  The option is a **migration flag**. It defaults to `false`, so the generated CSS is unchanged by
  default — existing output is byte-for-byte identical. Products can enable it incrementally (for
  example via an environment variable or feature gate in their build config), roll back instantly by
  turning it off and rebuilding, and a future major release will flip the default to `true` and remove
  the legacy branch.

  **Breaking:** `@compiled/babel-plugin` and `@compiled/css` now declare `@compiled/react` `>=1.0.0`
  as a peer dependency. Because these packages can emit the new 11-character atomic class names, the
  consuming app must run a runtime whose `ax()` can parse them (older runtimes use a fixed slice
  offset and corrupt deduplication of 11-character classes). Declaring the floor makes this
  install-time enforced: adopting a plugin version capable of the new hash forces the consumer onto
  `@compiled/react@>=1.0.0`, preventing a new-hash-output / old-runtime mismatch. This is the primary
  guardrail for consumers outside AFM (inside AFM the floor is additionally guaranteed by the root
  `resolutions` + `alignedDependencies` pin).

  Mixing legacy 9-character and new 11-character class names on a page is safe: the `>=1.0.0`
  runtime's `ax()` extracts the group key with `className.slice(0, className.length - 4)`, so the two
  formats produce different-length group keys, are structurally disjoint, and never falsely
  deduplicate each other (whether during the migration window or between pre-built dependency CSS and
  freshly compiled app CSS). This forward-compatible `ax()` behaviour already shipped in
  `@compiled/react@1.0.0` — which is exactly why it is the peer-dependency floor.

  The new `hashBase62` encoding is byte-for-byte compatible with the atlaspack SWC transformer's
  `to_base62`, ensuring class names are identical across the babel plugin and SWC toolchains.

## 0.13.2

### Patch Changes

- 6fb28946: Fix border-inline-start and border-inline-end not having any valid ordering in the shorthand-property-sorting ESLint rule

## 0.13.1

### Patch Changes

- 88bbe382: Remove superfluous border-block-_ and border-inline-_ from being listed as shorthand properties of border-top / border-bottom / border-left / border-right

## 0.13.0

### Minor Changes

- 2750e288: Make support for `@atlaskit/css` as a first-class import consistently default. This means the same functionality of parsing JSX pragmas, linting specific imports, and extracting styles should all work from `@compiled/react` and `@atlaskit/css` equally without the `importSources: ['@atlaskit/css']` config we use internally.

  This was already the default in about 1/3rd of the code, but not consistent. Now it's consistent and I've cleaned up duplicated import patterns.

## 0.12.0

### Minor Changes

- 9a15e742: Sort shorthand properties so that they come before longhand properties.

  When using Compiled, one of the following will happen:

  Option 1. If stylesheet extraction is turned off ("runtime mode"): shorthand properties will be sorted before longhand properties, as long as they are not in a pseudo-selector like `:hover` or `:active`. This is enabled by default and cannot be turned off.

  Option 2. If stylesheet extraction is turned on and one of the below is true:

  - You are using Webpack
  - You are using Parcel AND you are running in production mode

  ... shorthand properties will only be sorted if `sortShorthand: true` is passed to `CompiledExtractPlugin` (Webpack), or `sortShorthand: true` is passed to your Compiled config file like `.compiledcssrc` (Parcel). When sorting shorthand properties using this method (option 2), shorthand properties will always be sorted before longhand properties, taking precedence over pseudo-selectors like `:hover` or `:active`.

- 9a15e742: Remove unused buildSourceMap function

## 0.11.2

### Patch Changes

- a0f8c897: - Set `parserBabelPlugins` to default to `['typescript', 'jsx']`
  - This is already used across different Atlassian codebases.
  - Add missing 'babelrc: false' for all internal `parseAsync` calls to Babel. This was already included for `transformFromAstAsync` calls.

## 0.11.1

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.

## 0.11.0

### Minor Changes

- 04cb7ae7: Update the increaseSpecificity selector to play nicely with jsdom.

## 0.10.0

### Minor Changes

- e49b4f08: Add INCREASE_SPECIFICITY_SELECTOR to utils to consolidate this selector

## 0.9.2

### Patch Changes

- db572d43: - @compiled/babel-plugin-strip-runtime:
  - Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - The previous version of this PR caused a regression where using the classic JSX pragma `/** @jsx jsx */` with Emotion no longer worked; this is now fixed.
  - @compiled/utils: Add JSX pragma regex (as used by `babel-plugin-transform-react-jsx`) directly to @compiled/utils
  - @compiled/eslint-plugin: Use the official JSX pragma regex `/^\s*\*?\s*@jsx\s+([^\s]+)\s*$/m` instead of `/@jsx (\w+)/`; the former is used in `babel-plugin-transform-react-jsx`

## 0.9.1

### Patch Changes

- 3bb89ef9: Reverting jsx pragma fix which is causing runtime errors

## 0.9.0

### Minor Changes

- fbc17ed3: - `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
  - `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx

## 0.8.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

## 0.7.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

## 0.6.17

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions

## 0.6.16

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed

## 0.6.15

### Patch Changes

- 3bfe73f: Add preserveLeadingComments util

## 0.6.14

### Patch Changes

- b345bf4: Update dependencies and plugins to use postcss v8

## 0.6.13

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.6.12

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.6.11

### Patch Changes

- 40bc0d9: Package descriptions have been updated.

## 0.6.10

### Patch Changes

- 992e401: `createError` now takes a second optional argument for the error group.

## 0.6.9

### Patch Changes

- 0bb1c11: Added new `createError` and `toBoolean` functions.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
