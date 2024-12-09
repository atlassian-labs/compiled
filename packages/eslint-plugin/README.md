# @compiled/eslint-plugin

This plugin contains rules that should be used when working with `@compiled/react`.

## Installation

```sh
npm install @compiled/eslint-plugin --save-dev
```

## Usage

### Flat Config

Import the `@compiled/eslint-plugin` and add it to your plugins like so, then configure the rules you want to use under the "Supported rules" section.

```ts
import compiled from '@compiled/eslint-plugin';

export default [
  {
    plugins: {
      '@compiled': compiled,
    },
    rules: {
      '@compiled/no-js-xcss': 'error',
    },
  },
];
```

You can also enable the recommended rules for compiled by extending the `flat/recommended` config like so:

```ts
import compiled from '@compiled/eslint-plugin';

export default [compiled.configs['flat/recommended']];
```

### Legacy Config (`.eslintrc`)

Add `@compiled` to the plugins section of your `.eslintrc` configuration file, then configure the rules you want to use under the rules section.

```json
{
  "plugins": ["@compiled"],
  "rules": {
    "@compiled/no-js-xcss": "error"
  }
}
```

You can also enable the recommended rules for compiled by adding `plugin:@compiled/recommended` in extends:

```diff
{
+  "extends": ["plugin:@compiled/recommended"],
-  "plugins": ["@compiled"]
}
```

## Supported rules

✅ Included in the recommended configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\

| Name                                                                                                     | Description                                                                                                                                                                                     | Recommended | Fixable |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------: | :-----: |
| [@compiled/jsx-pragma](./src/rules/jsx-pragma)                                                           | Enforces a jsx pragma when using the `css` prop                                                                                                                                                 |             |   🔧    |
| [@compiled/local-cx-xcss](./src/rules/local-cx-xcss)                                                     | Ensures the `cx()` function is only used within the `xcss` prop                                                                                                                                 |     ✅      |         |
| [@compiled/no-css-prop-without-css-function](./src/rules/no-css-prop-without-css-function)               | Disallows `css` prop usages where it is either not wrapped in the `css` import from `@compiled/react` or where `@compiled` cannot determine whether the `css` import is included at build time. |     ✅      |   🔧    |
| [@compiled/no-css-tagged-template-expression](./src/rules/no-css-tagged-template-expression)             | Disallows the `css` tagged template expression                                                                                                                                                  |     ✅      |   🔧    |
| [@compiled/no-emotion-css](./src/rules/no-emotion-css)                                                   | Disallows `@emotion` usages                                                                                                                                                                     |             |   🔧    |
| [@compiled/no-empty-styled-expression](./src/rules/no-empty-styled-expression)                           | Disallows any `styled` expression to be used when passing empty arguments in `@compiled/react`                                                                                                  |     ✅      |         |
| [@compiled/no-exported-css](./src/rules/no-exported-css)                                                 | Disallows `css` usages from being exported                                                                                                                                                      |     ✅      |         |
| [@compiled/no-exported-keyframes](./src/rules/no-exported-keyframes)                                     | Disallows `keyframes` usages from being exported                                                                                                                                                |     ✅      |         |
| [@compiled/no-invalid-css-map](./src/rules/no-invalid-css-map)                                           | Checks the validity of a CSS map created through cssMap. This is intended to be used alongside TypeScript's type-checking.                                                                      |     ✅      |         |
| [@compiled/no-js-xcss](./src/rules/no-js-xcss)                                                           | The xcss prop is predicated on adhering to the type contract. Using it without TypeScript breaks this contract and thus is not allowed.                                                         |     ✅      |         |
| [@compiled/no-keyframes-tagged-template-expression](./src/rules/no-keyframes-tagged-template-expression) | Disallows the `keyframes` tagged template expression                                                                                                                                            |     ✅      |   🔧    |
| [@compiled/no-styled-tagged-template-expression](./src/rules/no-styled-tagged-template-expression)       | Disallows the `styled` tagged template expression                                                                                                                                               |     ✅      |   🔧    |
| [@compiled/no-suppress-xcss](./src/rules/no-suppress-xcss)                                               | The xcss prop is predicated on adhering to the type contract. Supressing it breaks this contract and thus is not allowed.                                                                       |     ✅      |         |
| [@compiled/shorthand-property-sorting](./src/rules/shorthand-property-sorting)                           | Prevent unwanted side-effects by ensuring shorthand properties are always defined before their corresponding longhand properties.                                                               |     ✅      |         |
