# @compiled/babel-plugin

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
