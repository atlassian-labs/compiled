# @compiled/eslint-plugin

This plugin contains rules that should be used when working with `@compiled/react`.

## Installation

```sh
npm install @compiled/eslint-plugin --save-dev
```

## Usage

Add `@compiled` to the plugins section of your `.eslintrc` configuration file, then configure the rules you want to use under the rules section.

```json
{
  "plugins": ["@compiled"],
  "rules": {
    "@compiled/rule-name": "error"
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

:white_check_mark: = recommended, :wrench: = fixable

| Name                                                                                                     | Description                                          | :white_check_mark: | :wrench: |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------ | -------- |
| [@compiled/jsx-pragma](./src/rules/jsx-pragma)                                                           | Enforces a jsx pragma when using the `css` prop      |                    | :wrench: |
| [@compiled/no-css-tagged-template-expression](./src/rules/no-css-tagged-template-expression)             | Disallows tagged template expressions in `css`       | :white_check_mark: | :wrench: |
| [@compiled/no-emotion-css](./src/rules/no-emotion-css)                                                   | Disallows `@emotion` usages                          |                    | :wrench: |
| [@compiled/no-keyframes-tagged-template-expression](./src/rules/no-keyframes-tagged-template-expression) | Disallows tagged template expressions in `keyframes` | :white_check_mark: | :wrench: |
| [@compiled/no-styled-tagged-template-expression](./src/rules/no-styled-tagged-template-expression)       | Disallows tagged template expressions in `styled`    | :white_check_mark: | :wrench: |
