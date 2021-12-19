---
'@compiled/babel-plugin': patch
'@compiled/babel-plugin-strip-runtime': patch
'@compiled/dom__experimental': patch
---

A new experimental API has been introduced that can be used with any view library under the package `@compiled/dom__experimental`, coming with a simpler API than the React package and strict constraints that all declared styles must be static and resolved within the same module.

Install both the experimental package and the babel plugin to get started.

```sh
npm i @compiled/dom__experimental
npm i @compiled/babel-plugin --save-dev
```

Turn on the Babel plugin:

```json
{
  "plugins": ["@compiled/babel-plugin/dom__experimental"]
}
```

Import and use in your code:

```jsx
import { cstyle } from '@compiled/dom__experimental';

const styles = cstyle.create({
  red: { color: 'red' },
  blue: { color: 'blue' },
});

function Text({ children }) {
  return <span className={styles.red}>{children}</span>;
}
```

Use the `Style` function to apply styles conditionally.

```jsx
import { cstyle } from '@compiled/dom__experimental';

const styles = cstyle.create({
  red: { color: 'red' },
  blue: { color: 'blue' },
});

function Text({ isRed, children }) {
  return <span className={cstyle([isRed ? styles.red : styles.blue])}>{children}</span>;
}
```

When building for production [turn on style extraction](https://compiledcssinjs.com/docs/css-extraction-webpack) - still currently Webpack only:

```js
// webpack.config.js
const { CompiledExtractPlugin } = require('@compiled/webpack-loader');

module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          {
            loader: '@compiled/webpack-loader',
            options: {
              extract: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [new CompiledExtractPlugin()],
};
```
