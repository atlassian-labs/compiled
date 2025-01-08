# @compiled/eslint-plugin

## 0.19.1

### Patch Changes

- d75db858: Fix some false positives in `shorthand-property-sorting` with css and cssMap

## 0.19.0

### Minor Changes

- e6d57ea1: add engines to formalize supported node versions - ^16.0.0 || >= 18.0.0
- e6d57ea1: support eslint v9

## 0.18.2

### Patch Changes

- a90961b3: Fix shorthand-property-sorting crashing when variable in css prop is not initialised

## 0.18.1

### Patch Changes

- 6fb28946: Fix border-inline-start and border-inline-end not having any valid ordering in the shorthand-property-sorting ESLint rule
- Updated dependencies [6fb28946]
  - @compiled/utils@0.13.2

## 0.18.0

### Minor Changes

- 88bbe382: Fix shorthand-property-sorting not detecting lint violations, and extend the rule to support almost all Compiled APIs

### Patch Changes

- Updated dependencies [88bbe382]
  - @compiled/utils@0.13.1

## 0.17.0

### Minor Changes

- 6fc00de6: Add `shorthand-property-sorting` to recommended ESLint rules

## 0.16.0

### Minor Changes

- e8b09ecd: Adding flat config preset for `@compiled/eslint-plugin` and adding missing descriptions to ESLint rules

## 0.15.0

### Minor Changes

- 2750e288: Make support for `@atlaskit/css` as a first-class import consistently default. This means the same functionality of parsing JSX pragmas, linting specific imports, and extracting styles should all work from `@compiled/react` and `@atlaskit/css` equally without the `importSources: ['@atlaskit/css']` config we use internally.

  This was already the default in about 1/3rd of the code, but not consistent. Now it's consistent and I've cleaned up duplicated import patterns.

### Patch Changes

- c786a445: Adding eslint rule to enforce shorthand css properties come before longhand
- Updated dependencies [2750e288]
  - @compiled/utils@0.13.0

## 0.14.1

### Patch Changes

- Updated dependencies [9a15e742]
- Updated dependencies [9a15e742]
  - @compiled/utils@0.12.0

## 0.14.0

### Minor Changes

- dbb7ba43: Update @compiled/jsx-pragma to properly support `options.importSources` for pragmas, eg. using a wrapper around '@compiled/react' to distribute a typed variant.

## 0.13.9

### Patch Changes

- 4f5865a1: Fixes the parsing of custom properties (CSS variables) names in object syntax. The casing is now preserved instead of being converted to kebab-case.
- Updated dependencies [4f5865a1]
  - @compiled/utils@0.11.1

## 0.13.8

### Patch Changes

- Updated dependencies [04cb7ae7]
  - @compiled/utils@0.11.0

## 0.13.7

### Patch Changes

- Updated dependencies [e49b4f08]
  - @compiled/utils@0.10.0

## 0.13.6

### Patch Changes

- 292a05d5: Add `importSources` option to `jsx-pragma` rule, to specify additional libraries that should be considered Compiled imports

## 0.13.5

### Patch Changes

- db572d43: - @compiled/babel-plugin-strip-runtime:
  - Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - The previous version of this PR caused a regression where using the classic JSX pragma `/** @jsx jsx */` with Emotion no longer worked; this is now fixed.
  - @compiled/utils: Add JSX pragma regex (as used by `babel-plugin-transform-react-jsx`) directly to @compiled/utils
  - @compiled/eslint-plugin: Use the official JSX pragma regex `/^\s*\*?\s*@jsx\s+([^\s]+)\s*$/m` instead of `/@jsx (\w+)/`; the former is used in `babel-plugin-transform-react-jsx`
- Updated dependencies [db572d43]
  - @compiled/utils@0.9.2

## 0.13.4

### Patch Changes

- 6dfb0cdf: Fixed eslint bug for no-empty-styled-expressions rule that detected false positives

## 0.13.3

### Patch Changes

- 3bb89ef9: Reverting jsx pragma fix which is causing runtime errors
- Updated dependencies [3bb89ef9]
  - @compiled/utils@0.9.1

## 0.13.2

### Patch Changes

- 9dd62659: Fixed eslint rule declaration typo causing missing rule errors

## 0.13.1

### Patch Changes

- 45186502: Added no-empty-styled-expression rule to eslint plugin rule declarations

## 0.13.0

### Minor Changes

- 83f2c48b: Created ESLint rule to disallow usage of empty styled.element() function calls/empty object arguments

## 0.12.0

### Minor Changes

- 2d1a5e76: Add two more configuration options to the `no-css-prop-without-css-function` rule:

  - `ignoreIfImported` accepts an array of library names. If specified, rule execution will be skipped for all files that import any of the specified libraries (e.g. `@emotion/react`). By default, this is an empty array.
  - `excludeReactComponents` is a boolean that determines whether this rule should skip all React components (as opposed to plain HTML elements). False by default.

## 0.11.0

### Minor Changes

- fbc17ed3: - `@compiled/babel-plugin-strip-runtime`: Fix `css` function calls not being extracted when using classic JSX pragma syntax and `@babel/preset-react` is turned on. Now, when the classic JSX pragma syntax is used for Compiled and `@babel/preset-react` is turned on (assuming `@babel/preset-react` runs before `@compiled/babel-plugin-strip-runtime`), the JSX pragma and the `jsx` import will be completely removed in the output.
  - `@compiled/eslint-plugin`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx
  - `@compiled/utils`: Change regex in `jsx-pragma` rule to match @babel/plugin-transform-react-jsx

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0

## 0.10.1

### Patch Changes

- c6e2e87c: Fix xcss eslint rules not compatible with eslint v7
- 28559a54: Update no-exported-css and no-exported-keyframes message

## 0.10.0

### Minor Changes

- be019f11: Add detectConflictWithOtherLibraries and onlyRunIfImportingCompiled config options to jsx-pragma ESLint rule. Both are set to true by default, hence the breaking change.

  `detectConflictWithOtherLibraries` raises a linting error if `css` or `jsx` is imported from `@emotion/react` (or `@emotion/core`) in the same file
  as a Compiled import. Set to true by default.

  `onlyRunIfImportingCompiled` sets this rule to only suggest adding the JSX pragma if the `css` or `cssMap` functions are imported from `@compiled/react`, as opposed to whenever the `css` attribute is detected at all. Set to false by default.

## 0.9.4

### Patch Changes

- 351dbc2a: Adds a new supplementary rule for xcss prop — `no-suppress-xcss`.
- 9e75ff2c: Update jsx-pragma lint rule to enforce the pragma is in scope when passing the `className` prop on host elements an output of xcss prop.
- 157e7eec: Add supplementary lint rule for xcss prop `local-cx-xcss`.
- 2010cde2: Adds new supplementary lint rule for xcss prop `no-js-xcss`.

## 0.9.3

### Patch Changes

- 941a723f: Bugfix: no-css-tagged-template-expression ESLint rule truncates strings which include colons during autofixing.

## 0.9.2

### Patch Changes

- 28c927c1: Fix edge case where no-css-prop-without-css-function crashes

## 0.9.1

### Patch Changes

- bfa60425: Replace context.sourceCode with context.getSourceCode(), to restore compatibility with ESLint v7 and <v8.40.0

## 0.9.0

### Minor Changes

- 685093a5: Add ESLint rule `@compiled/no-invalid-css-map` for linting cssMap usages

### Patch Changes

- 59687aba: Fix @compiled/eslint-plugin no-css-prop-without-css-function rule adding duplicate css import

## 0.8.1

### Patch Changes

- 40904082: Allow function parameters and imported values for left side of any logical expression in `css` attribute (A && B, A || B, A ?? B)

## 0.8.0

### Minor Changes

- 9cfda8ef: no-css-prop-without-css-function: Forbid imported styles and function parameters in `css` attribute

## 0.7.0

### Minor Changes

- c4e6b7c0: Change TypeScript compiler target from es5 to es6.

## 0.6.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12

## 0.5.0

### Minor Changes

- 1dc17bce: Add new ESLint rule for CSS prop without css function

## 0.4.8

### Patch Changes

- e887c2b5: Clean up dependencies of packages

## 0.4.7

### Patch Changes

- 7fc17211: Wrap strings with quotes when auto-fixing tagged template expressions in ESLint rule

## 0.4.6

### Patch Changes

- 8acf1e21: Allow exporting components with references to css({})
- 5e856e8c: Autofix empty tagged template expressions
- 08a963fc: Bump flowgen types

## 0.4.5

### Patch Changes

- de283788: Fix: double quotes when autofixing no-\*-tagged-template-expression
- 72187dc1: Fix: selector disappears when autofixing no-\*-tagged-template-expression linting errors

## 0.4.4

### Patch Changes

- 62987200: Fix eslint rule breaking when having multiple selectors across lines

## 0.4.3

### Patch Changes

- 10533c7f: Add Type support to no-styled-tagged-template-expression ESLint rule

## 0.4.2

### Patch Changes

- c8371532: Handle whole module imports

## 0.4.1

### Patch Changes

- 6e92764: Fix no-exported-css and no-exported-keyframes errors within components

## 0.4.0

### Minor Changes

- a57d3be: Add no-exported-css and no-exported-keyframes rules

## 0.3.0

### Minor Changes

- 5d699ed: Add no-tagged-template-expression rules for each API

### Patch Changes

- 356b120: Apply react/jsx-filename-extension rule as needed

## 0.2.2

### Patch Changes

- 8c9ab8c: Adds url to lint rules
- 8c9ab8c: Update `homepage` and other `package.json` properties

## 0.2.1

### Patch Changes

- dedadbb: The `jsx-pragma` rule now removes the default react import when moving to the automatic runtime and it isn't used.

## 0.2.0

### Minor Changes

- f203635: Renames `emotion-to-compiled` rule to `no-emotion-css`.

### Patch Changes

- f203635: The `no-emotion-css` rule now keeps the jsx pragma around if defined.
- f203635: The `no-emotion-css` rule now will check for `jsxImportSource` pragma usage with a supplementary fixer.
- 1a9e503: Adds `jsx-pragma` rule,
  useful when working with the `css` prop.
  When enabled it will error when the jsx pragma is missing or when using the wrong pragma for the configured runtime.
- 79cfb08: Package now built with project references.
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.1.0

### Minor Changes

- 507bcad: Initial release of the `@compiled/eslint-plugin`. This will become a useful complementary tool to use with the `@compiled` library.
