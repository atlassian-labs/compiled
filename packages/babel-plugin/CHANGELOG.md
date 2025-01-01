# @compiled/babel-plugin

## 0.35.0

### Minor Changes

- 34e5339a: Fix `@compiled/babel-plugin` to not require `cssMap()` to be called prior to use.

  Example, this failed before for no reason other than the fact that our `state.cssMap` was generated _after_ `JSXElement` and `JSXOpeningElement` were ran.

  ```tsx
  import { cssMap } from '@compiled/react';
  export default () => <div css={styles.root} />;
  const styles = cssMap({ root: { padding: 8 } });
  ```

- 34e5339a: Throw an error when compiling a `cssMap` object where we expect a `css` or nested `cssMap` object.

  Example of code that silently fails today, using `styles` directly:

  ```tsx
  import { cssMap } from '@compiled/react';
  const styles = cssMap({ root: { padding: 8 } });
  export default () => <div css={styles} />;
  ```

  What we expect to see instead, using `styles.root` instead:

  ```tsx
  import { cssMap } from '@compiled/react';
  const styles = cssMap({ root: { padding: 8 } });
  export default () => <div css={styles.root} />;
  ```

## 0.34.0

### Minor Changes

- 0ebbfc15: Fix supporting ternaries referencing cssMap style objects when extracting styles.

## 0.33.0

### Patch Changes

- Updated dependencies [88bbe382]
- Updated dependencies [f63b99d4]
  - @compiled/utils@0.13.1
  - @compiled/css@0.18.0

## 0.32.2

### Patch Changes

- Updated dependencies [9b960009]
  - @compiled/css@0.17.0

## 0.32.1

### Patch Changes

- c1655312: Documents what happens when mixing extraction and classHashPrefix

## 0.32.0

### Minor Changes

- 4fb5c6e1: Adds a new option that can be passed to the babel plugin called `classHashPrefix`. Its value is used to add a prefix to the class names when generating their hashes.
- 2750e288: Make support for `@atlaskit/css` as a first-class import consistently default. This means the same functionality of parsing JSX pragmas, linting specific imports, and extracting styles should all work from `@compiled/react` and `@atlaskit/css` equally without the `importSources: ['@atlaskit/css']` config we use internally.

  This was already the default in about 1/3rd of the code, but not consistent. Now it's consistent and I've cleaned up duplicated import patterns.

### Patch Changes

- Updated dependencies [4fb5c6e1]
- Updated dependencies [2750e288]
  - @compiled/css@0.16.0
  - @compiled/utils@0.13.0

## 0.31.0

### Patch Changes

- Updated dependencies [9a15e742]
- Updated dependencies [9a15e742]
  - @compiled/utils@0.12.0
  - @compiled/css@0.15.0

## 0.30.0

### Minor Changes

- 83c721d6: Allow an import of `jsx` from our internal `@atlaskit/css` package for babel plugin pragma resolutions.

## 0.29.1

### Patch Changes

- 5c04f896: Fix 'as const' expressions causing Compiled to crash at build time

## 0.29.0

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

## 0.28.7

### Patch Changes

- 36c4f0b9: Fix handling of `content` property.

  - The value of the `content` property will no longer automatically have quotes erroneously added around it, if the value is one of `open-quote`, `counter(...)`, `url(...)`, `inherit`, `none`, and so on.
  - The full regex used to check is as follows: `/^([A-Za-z\-]+\([^]*|[^]*-quote|inherit|initial|none|normal|revert|unset)(\s|$)/`

- 8ed3e9bf: The `@atlaskit/css` is now picked up as a default import source, meaning consumers of Compiled don't need to configure it to be picked up.

## 0.28.6

### Patch Changes

- Updated dependencies [e49b4f08]
- Updated dependencies [e49b4f08]
  - @compiled/css@0.12.3
  - @compiled/utils@0.10.0

## 0.28.5

### Patch Changes

- 1b1a94a5: Remove the invariant to fail on an empty cssMap object for easier iterative development.

## 0.28.4

### Patch Changes

- 4b2e5eeb: The CSS map transform now allows top level at rules to be defined.

## 0.28.3

### Patch Changes

- 7d3406c9: Previously, if you passed `props => ...` directly to `styled.div` or `css()`, and the return value of the arrow function was an object, you would cause `@compiled/babel-plugin` to crash:

  ```tsx
  import { styled } from '@compiled/react';
  import React from 'react';

  const Component = styled.div((props) => ({
    color: `${props.customColor}`,
    background: props.background,
  }));
  ```

  While at the same time, wrapping the return value inside a logical expression or ternary expression would make it work perfectly fine:

  ```tsx
  const Styles = styled.div((props) =>
    props.isEditing ? {} : { backgroundColor: props.highlightColor }
  );
  ```

  With this version, both of these forms will work without issue. :)

- d5c6578c: Fix props (used by Compiled) being incorrectly forwarded to React when default values are used.

## 0.28.2

### Patch Changes

- 35675858: Fix the compiler throwing when multiple Compiled imports were used in the same module.

## 0.28.1

### Patch Changes

- 5bd1b492: Introduce a new config option `increaseSpecificity` that increases the specificity of all generated Compiled classes. This is useful when migrating between two or more other styling solutions to Compiled.
- Updated dependencies [5bd1b492]
  - @compiled/css@0.12.2

## 0.28.0

### Minor Changes

- df91c60f: \[BREAKING\] Fix @compiled/babel-plugin handling of classic JSX pragma. Involves several breaking changes.

  - Move the below @compiled/babel-plugin-strip-runtime behaviour to @compiled/babel-plugin
    - Classic JSX pragma will no longer affect the Babel output: instead of seeing `jsx` function calls in the output, you will see `React.createElement` calls again. (Added to @compiled/babel-plugin-strip-runtime in v0.27.0)
  - @compiled/babel-plugin: Due to the above behaviour change, a classic JSX pragma (`/** @jsx jsx */`) is used, React will always be imported regardless of the value of `importReact`.
  - @compiled/babel-plugin: We don't support specifying the `pragma` option through `@babel/preset-react` or `@babel/plugin-transform-react-jsx` - we will now throw an error if this happens.

## 0.27.1

### Patch Changes

- 39714ae3: cssMap() no longer throws an invariant if no styles were generated.

## 0.26.3

### Patch Changes

- a9509cc0: Compiled runtime is no-longer inserted for non-Compiled xcss prop usage.

## 0.26.1

### Patch Changes

- 9857009f: Introduce new API `createStrictAPI` which returns a strict subset of Compiled APIs augmented by a type definition.
  This API does not change Compileds build time behavior — merely augmenting
  the returned API types which enforce:

  - all APIs use object types
  - property values declared in the type definition must be used (else fallback to defaults)
  - a strict subset of pseudo states/selectors
  - unknown properties to be a type violation

  To set up:

  1. Declare the API in a module (either local or in a package):

  ```tsx
  import { createStrictAPI } from '@compiled/react';

  // ./foo.ts
  const { css, cssMap, XCSSProp, cx } = createStrictAPI<{
    color: 'var(--ds-text)';
    '&:hover': { color: 'var(--ds-text-hover)' };
  }>();

  // Expose APIs you want to support.
  export { css, cssMap, XCSSProp, cx };
  ```

  2. Configure Compiled to pick up this module:

  ```diff
  // .compiledcssrc
  {
  +  "importSources": ["./foo.ts"]
  }
  ```

  3. Use the module in your application code:

  ```tsx
  import { css } from './foo';

  const styles = css({ color: 'var(--ds-text)' });

  <div css={styles} />;
  ```

## 0.26.0

### Minor Changes

- 9860df38: Added error in development/debug mode when using 'innerRef' instead of 'ref'

### Patch Changes

- 52ea5aba: Fix xcss being incompatible with codebases that use Emotion and Compiled:

  - Add `processXcss` option to `@compiled/babel-plugin`. If `processXcss` is set to false, `xcss` usages will be ignored, and will not be processed as Compiled. (Note that `xcss` is currently implemented in Atlassian Design System using Emotion.) Defaults to `true`.
  - `css` usages in a file will no longer be processed as Compiled if `xcss` is used in the same file, so long as there is not a `@compiled/react` import specified in that file.

## 0.25.0

### Patch Changes

- Updated dependencies [fbc17ed3]
  - @compiled/utils@0.9.0
  - @compiled/css@0.12.1

## 0.24.3

### Patch Changes

- be019f11: Add detectConflictWithOtherLibraries and onlyRunIfImportingCompiled config options to jsx-pragma ESLint rule. Both are set to true by default, hence the breaking change.

  `detectConflictWithOtherLibraries` raises a linting error if `css` or `jsx` is imported from `@emotion/react` (or `@emotion/core`) in the same file
  as a Compiled import. Set to true by default.

  `onlyRunIfImportingCompiled` sets this rule to only suggest adding the JSX pragma if the `css` or `cssMap` functions are imported from `@compiled/react`, as opposed to whenever the `css` attribute is detected at all. Set to false by default.

## 0.24.2

### Patch Changes

- 4caa6784: The xcss prop is now available.
  Declare styles your component takes with all other styles marked as violations
  by the TypeScript compiler. There are two primary use cases for xcss prop:

  - safe style overrides
  - inverting style declarations

  Interverting style declarations is interesting for platform teams as
  it means products only pay for styles they use as they're now the ones who declare
  the styles!

  The `XCSSProp` type has generics which must be defined — of which should be what you
  explicitly want to maintain as API. Use `XCSSAllProperties` and `XCSSAllPseudos` types
  to enable all properties and pseudos.

  ```tsx
  import { type XCSSProp } from '@compiled/react';

  interface MyComponentProps {
    // Color is accepted, all other properties / pseudos are considered violations.
    xcss?: XCSSProp<'color', never>;

    // Only backgrond color and hover pseudo is accepted.
    xcss?: XCSSProp<'backgroundColor', '&:hover'>;

    // All properties are accepted, all pseudos are considered violations.
    xcss?: XCSSProp<XCSSAllProperties, never>;

    // All properties are accepted, only the hover pseudo is accepted.
    xcss?: XCSSProp<XCSSAllProperties, '&:hover'>;
  }

  function MyComponent({ xcss }: MyComponentProps) {
    return <div css={{ color: 'var(--ds-text-danger)' }} className={xcss} />;
  }
  ```

  The xcss prop works with static inline objects and the [cssMap](https://compiledcssinjs.com/docs/api-cssmap) API.

  ```tsx
  // Declared as an inline object
  <Component xcss={{ color: 'var(--ds-text)' }} />;

  // Declared with the cssMap API
  const styles = cssMap({ text: { color: 'var(--ds-text)' } });
  <Component xcss={styles.text} />;
  ```

  To concatenate and conditonally apply styles use the `cssMap` and `cx` functions.

- dccb71e0: Adds third generic for XCSSProp type for declaring what properties and pseudos should be required.

## 0.24.1

### Patch Changes

- 4a11c5f4: Bugfix: handle memberExpression as CSS object property

## 0.24.0

### Minor Changes

- 809cc389: Update resolver to support module paths

## 0.22.0

### Minor Changes

- 4a2174c5: Implement the `cssMap` API to enable library users to dynamically choose a varied set of CSS rules.

## 0.21.0

### Minor Changes

- 487bbd46: Support default parameters in arrow functions, and explicitly throw error when using unsupported syntax in arrow function parameters

## 0.20.0

### Minor Changes

- a24c157c: Skip expansion of shorthand properties (e.g. padding, margin) if they have dynamic values (e.g. CSS variables, ternary expressions, arrow functions)

### Patch Changes

- Updated dependencies [a24c157c]
  - @compiled/css@0.12.0

## 0.19.1

### Patch Changes

- 9aa6909a: Add error when expressionToString runs infinite loop ("Error: Maximum call stack size exceeded")

## 0.19.0

### Minor Changes

- c4e6b7c0: Introduce a new runtime class name library, which resolves the `ax` chaining issue. The new library is used only if class name compression is enabled.
- c4e6b7c0: Change TypeScript compiler target from es5 to es6.
- 25779e3a: Statically evaluate variables inside nested template strings (excluding template strings inside functions)

### Patch Changes

- Updated dependencies [c4e6b7c0]
  - @compiled/utils@0.8.0
  - @compiled/css@0.11.0

## 0.18.1

### Patch Changes

- Updated dependencies [f9005e2b]
- Updated dependencies [488deaa6]
  - @compiled/css@0.10.0

## 0.18.0

### Minor Changes

- a41e41e6: Update monorepo node version to v18, and drop support for node v12
- f9c957ef: Add an option to compress class names based on "classNameCompressionMap", which is provided by library consumers.
  Add a script to generate compressed class names.

### Patch Changes

- Updated dependencies [a41e41e6]
- Updated dependencies [f9c957ef]
  - @compiled/css@0.9.0
  - @compiled/utils@0.7.0

## 0.17.3

### Patch Changes

- e887c2b5: Clean up dependencies of packages
- 4877ec38: Bump babel versions
- Updated dependencies [e887c2b5]
- Updated dependencies [4877ec38]
  - @compiled/css@0.8.8
  - @compiled/utils@0.6.17

## 0.17.2

### Patch Changes

- 14f2091b: Handle member expression with css props
- 50b51724: Added option "addComponentName" to display styled component name on HTML on non-production environment
- 08a963fc: Bump flowgen types

## 0.17.1

### Patch Changes

- 99af4aa0: Fix babel-plugin adding a unwanted call expression in traverseCallExpression
- Updated dependencies [8a74fcd7]
  - @compiled/css@0.8.6

## 0.16.5

### Patch Changes

- fcda0097: Fix bug where props are not forwarded when composing components in the styled API
- dcb333a2: Use less likely to clash variable names in styled template
- 5ee1a866: - Fixes bug where more than one import cannot be used in template literal object property key
  - Support string binary operation in object property keys

## 0.16.4

### Patch Changes

- d2bd6305: - Normalize prop usage in styled API to make it easier to avoid name clashing
  - Fix bug in styled API where destructuring can remove values out of props
  - Ensure props are not displayed as HTML attributes, unless they are valid attributes
- 17de9d1f: Omit rules with empty values from stylesheet
- Updated dependencies [17de9d1f]
  - @compiled/css@0.8.5

## 0.16.3

### Patch Changes

- 5272281a: Add configurable options to optimize CSS
- Updated dependencies [5272281a]
  - @compiled/css@0.8.4

## 0.16.2

### Patch Changes

- 8912717: Revert "Bug - shadow variable clash with destructured props (#1193)"

## 0.16.1

### Patch Changes

- 6c1ea7f: Support Compiled in files with TypeScript as expressions

## 0.16.0

### Minor Changes

- e1ac2ed: Rename babelPlugins configuration option to parserBabelPlugins and add transformerBabelPlugins option

### Patch Changes

- 4f8f2aa: Fixed shadow variables clashing with destructured props
- d3b5fb9: Support template literals as a selector in an object
- Updated dependencies [ad4d257]
- Updated dependencies [8384893]
  - @compiled/css@0.8.3

## 0.15.0

### Minor Changes

- 0b38c11: Optimize condtional expressions with object styles
- 2d24709: Statically evaluate unary expressions that convert to negative numbers

## 0.14.1

### Patch Changes

- 6d6b579: Fixed CSS property matching for conditional expression optimization

## 0.14.0

### Minor Changes

- 2ad385c: Optimize conditional expressions to create CSS classes per conditional branch where possible
- c96c562: Use fallback if babel evaluate throws error during evaluation
- 73821f2: Statically evaluate mathematical binary expressions

### Patch Changes

- 5e3ad5e: Fixed bug where negative and positive values were getting evaluated as the same
- 356b120: Apply react/jsx-filename-extension rule as needed
- 588cd4f: Use preserveLeadingComments util from @compiled/utils
- Updated dependencies [356b120]
  - @compiled/css@0.8.2
  - @compiled/utils@0.6.16

## 0.13.0

### Minor Changes

- 307bb83: Handle export named declarations with source when resolving modules

### Patch Changes

- 18dcdf8: Fix conditional rules not generating the expected output:

  - classes should be generated instead of CSS variables
  - style inside a pseudo class ( eg : hover) or pseudo element ( eg :before) should be applied to related element

## 0.12.1

### Patch Changes

- 63e14bd: Ensure that any leading comment is preserved at the top of the processed file before inserting additional imports
- f2cd347: Added a fix to statically evaluate deconstructed values from deeply nested objects

## 0.12.0

### Minor Changes

- f139218: Handle destructuring `property: value` pairs returned from arrow functions, and add support for nested and alias destructuring.
- 858146c: Add babel plugins support
- b0adb8a: Added support for conditional expressions when passing an array to the `css` prop of an element

### Patch Changes

- b0adb8a: Fix support for CSS helper call expressions when used in conditional expressions (i.e. the `css(...)` function provided by compiled)

## 0.11.4

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- c757259: Update type definition dependencies
- 63148ec: Support file importing in babel plugin and add configuration in loaders
- Updated dependencies [c757259]
- Updated dependencies [63148ec]
  - @compiled/css@0.8.1

## 0.11.3

### Patch Changes

- 3b7c188: Refactor the way member expressions are statically evaluated and handle more combinations of expressions within a member
- c2ae4eb: Resolve css-what and nth-check to new versions in @compiled/css
- Updated dependencies [c2ae4eb]
- Updated dependencies [b345bf4]
  - @compiled/css@0.8.0
  - @compiled/utils@0.6.14

## 0.11.2

### Patch Changes

- 8c9ab8c: Update `homepage` and other `package.json` properties
- Updated dependencies [8c9ab8c]
- Updated dependencies [1ca19be]
  - @compiled/css@0.7.2
  - @compiled/utils@0.6.13

## 0.11.1

### Patch Changes

- 79cfb08: Compiled will no longer try to traverse modules boundaries of its own.
- 14368bb: Fix issue where a styled value function using both object destructuring and a template literal in at least one branch resulted in a CSS error
- 68ebac3: Add support for namespace imports and export specifiers
- 427cead: Compiled now supports turning on the `css` prop using jsx pragmas (both with `@jsx` and `@jsxImportSource`).
- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.
- Updated dependencies [79cfb08]
  - @compiled/css@0.7.1
  - @compiled/utils@0.6.12

## 0.11.0

### Minor Changes

- fa6af90: Add support for nested ternary operators. Additionally, Compiled will no longer transform ternaries into logical statements unless one side is undefined.

### Patch Changes

- e015a3a: Add comment directive `// @compiled-disable(-next)-line) transform-css-prop` to disable Compiled processing on CSS prop

## 0.10.0

### Minor Changes

- 53a3d71: **Breaking change:** Ternary conditionals will no longer add falsy path styles when expression evaluates truthy

### Patch Changes

- b68411c: Fix styled path check

## 0.9.0

### Minor Changes

- 0b60ae1: Support custom `resolver`
- 2092839: Allow inline strings and inline css mixins in conditional expressions. Fix ordering of styles in template literals.

## 0.8.0

### Minor Changes

- 53935b3: Add `ObjectExpression` support to `css`

## 0.7.0

### Minor Changes

- bcb2a68: Add support for `keyframes`
- a7ab8e1: Add support for conditional rules for `Styled`

### Patch Changes

- e1dc346: Fix missing key prop on generated React elements
- 48805ec: Use the correct expression in the style prop, when an identifier is shadowed by a function argument
- 587e729: Generate CSS for rules defined before a mixin and ensure that mixins can be overriden
- Updated dependencies [bcb2a68]
  - @compiled/css@0.7.0

## 0.6.14

### Patch Changes

- 30ddaf4: Adds a support of computed properties static evaluation in object styles.

## 0.6.13

### Patch Changes

- 40bc0d9: Package descriptions have been updated.
- 1b1c964: The `css` mixin API is now available,
  functioning similarly to the [emotion equivalent](https://emotion.sh/docs/composition).

  ```jsx
  import { css } from '@compiled/react';

  <div
    css={css`
      display: flex;
      font-size: 50px;
      color: blue;
    `}>
    blue text
  </div>;
  ```

  For more help, read the docs: https://compiledcssinjs.com/docs/css.

- Updated dependencies [40bc0d9]
- Updated dependencies [1b1c964]
  - @compiled/css@0.6.11
  - @compiled/utils@0.6.11

## 0.6.12

### Patch Changes

- ca573d7: Styled APIs now have display names when running development builds.

## 0.6.10

### Patch Changes

- 37108e4: Compiled dependencies are now using carat range.
- Updated dependencies [992e401]
- Updated dependencies [37108e4]
  - @compiled/utils@0.6.10
  - @compiled/css@0.6.10

## 0.6.9

### Patch Changes

- Updated dependencies [0bb1c11]
- Updated dependencies [0bb1c11]
  - @compiled/css@0.6.9
  - @compiled/utils@0.6.9

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
- Updated dependencies [aea3504]
  - @compiled/css@0.6.8
  - @compiled/utils@0.6.8
