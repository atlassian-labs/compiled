# @compiled/eslint-plugin

This plugin contains rules that should be used when working with `@compiled/react`.

## Installation

```sh
npm i @compiled/eslint-plugin --save-dev
```

## Usage

Add the plugin to your `.eslintrc.js` file.

```diff
module.exports = {
  plugins: [
+    '@compiled',
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

Rules will where possible come with fixers. For individual rules see the [`rules`](./src/rules) folder,
however it's strongly recommended to use the rules as above.
You can read more about configuring eslint in their [documentation](https://eslint.org/docs/user-guide/configuring).
