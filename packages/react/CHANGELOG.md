# @compiled/react

## 0.10.2

### Patch Changes

- 254a6f6: Added ESLint rule to prevent use of extraneous packages, and added these usages of these packages as dependencies. Added new namespace `@compiled-private` to prevent name clashes with existing npm packages.
- c757259: Update type definition dependencies
- 6649528: Changed the SSR check to be based on the presence of `document` instead of looking for Node processes.

## 0.10.1

### Patch Changes

- d3e257c: Fixes `css` function types to allow nested styles
- 8c9ab8c: Update `homepage` and other `package.json` properties
- 8c9ab8c: JSDoc descriptions for all exports have been updated, let us know what you think!
- 8c9ab8c: `ClassNames` component now has its style prop typed as `CSSProperties` instead of a string map

## 0.10.0

### Minor Changes

- 427cead: **Breaking change:** When using the `css` prop with [TypeScript](https://www.typescriptlang.org) you now need to declare a JSX pragma enabling types for that module. Previously when importing the `@compiled/react` package the global JSX namespace would be polluted as a side effect potentially causing collisions with other CSS-in-JS libraries. Now thanks to the use of [locally scoped JSX namespaces](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#locally-scoped-jsx-namespaces) the global JSX namespace will no longer be polluted.

  As an added bonus the `css` prop will only be available on JSX elements that have also defined a `className` prop with the potential for more type safe features later on.

  Make sure to update all Compiled dependencies to latest when adopting this change.

  **Automatic runtime**

  ```diff
  -import '@compiled/react';
  +/** @jsxImportSource @compiled/react */

  <div css={{ display: 'block' }} />;
  ```

  **Classic runtime**

  ```diff
  -import '@compiled/react';
  +/** @jsx jsx */
  +import { jsx } from '@compiled/react';

  <div css={{ display: 'block' }} />;
  ```

  To aid consumers in adopting this change easily, a new ESLint rule `jsx-pragma` has been created which will automatically migrate you to use a JSX pragma if missing when running with `--fix`. The rule takes an option to configure the runtime (either classic or automatic) and defaults to automatic.

  ```sh
  npm i @compiled/eslint-plugin
  ```

  ```json
  {
    "rules": {
      "@compiled/jsx-pragma": ["error", { "runtime": "classic" }]
    }
  }
  ```

### Patch Changes

- 79cfb08: Internal refactor changing how the TypeScript compiler picks up source files.

## 0.9.1

### Patch Changes

- 4309aaa: Patch inexact flow type on styled

## 0.9.0

### Minor Changes

- 2092839: Allow inline strings and inline css mixins in conditional expressions. Fix ordering of styles in template literals.

## 0.8.0

### Minor Changes

- 4210ff6: Add flow types support
- 53935b3: Add `ObjectExpression` support to `css`

## 0.7.0

### Minor Changes

- bcb2a68: Add support for `keyframes`
- a7ab8e1: Add support for conditional rules for `Styled`

## 0.6.13

### Patch Changes

- 13c3a60: add support of additional parameters to css function

## 0.6.12

### Patch Changes

- b5b4e8a: Catch unhandled exception on inserting rules with prefixed selectors.

## 0.6.11

### Patch Changes

- ee3363e: Fix HTML characters escapes in style tags on SSR.

## 0.6.10

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
    `}
  >
    blue text
  </div>;
  ```

  For more help, read the docs: https://compiledcssinjs.com/docs/css.

## 0.6.9

### Patch Changes

- 4032cd4: Memo has been removed from the style component which was breaking re-renders at times.

## 0.6.8

### Patch Changes

- aea3504: Packages now released with [changesets](https://github.com/atlassian/changesets).
