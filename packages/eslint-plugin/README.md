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

:white_check_mark: = recommended, :wrench: = automatically fixable, :bulb: = manually fixable

| Name                                                                                                     | Description                                          | :white_check_mark: | Fixable  |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | :----------------: | :------: |
| [@compiled/jsx-pragma](./src/rules/jsx-pragma)                                                           | Enforces a jsx pragma when using the `css` prop      |                    | :wrench: |
| [@compiled/no-css-tagged-template-expression](./src/rules/no-css-tagged-template-expression)             | Disallows the `css` tagged template expression       | :white_check_mark: | :wrench: |
| [@compiled/no-emotion-css](./src/rules/no-emotion-css)                                                   | Disallows `@emotion` usages                          |                    | :wrench: |
| [@compiled/no-exported-css](./src/rules/no-exported-css)                                                 | Disallows `css` usages from being exported           | :white_check_mark: |          |
| [@compiled/no-exported-keyframes](./src/rules/no-exported-keyframes)                                     | Disallows `keyframes` usages from being exported     | :white_check_mark: |          |
| [@compiled/no-keyframes-tagged-template-expression](./src/rules/no-keyframes-tagged-template-expression) | Disallows the `keyframes` tagged template expression | :white_check_mark: | :wrench: |
| [@compiled/no-styled-tagged-template-expression](./src/rules/no-styled-tagged-template-expression)       | Disallows the `styled` tagged template expression    | :white_check_mark: | :wrench: |
| [@compiled/no-css-prop-without-css-function](./src/rules/no-css-prop-without-css-function)               | Disallows css prop without the css function          | :white_check_mark: | :wrench: |
