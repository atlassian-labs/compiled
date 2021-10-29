# Compiled ESLint Plugin

This plugin contains rules that should be used when working with the `@compiled/react`.

## Installation

```sh
yarn add @compiled/eslint-plugin -D
```

## Usage

Add the plugin to your `.eslintrc.js` file.

```diff
module.exports = {
  plugins: [
+    '@compiled/eslint-plugin',
  ],
};
```

Turn on the rules.

```diff
module.exports = {
  extends: [
+    'plugin:@compiled/eslint-plugin/recommended',
  ],
};
```

Rules will where possible come with fixers.
For individual rules see the [`rules`](./src/rules) folder,
however its strongly recommended to use the rules as above.
You can read more about configuring eslint in their [documentation](https://eslint.org/docs/user-guide/configuring).
