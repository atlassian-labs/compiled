# [👷‍♀ ‍Compiled](https://compiledcssinjs.com/)

The CSS in JS authoring experience you love without the runtime cost.
[Get started now ➡️](https://compiledcssinjs.com/docs)

## Installation

```bash
npm i @compiled/css-in-js
```

### Babel

<details>
  <summary>Click to expand...</summary>

```
npm i @compiled/babel-plugin-css-in-js
```

Then add the plugin to your [Babel config](https://babeljs.io/docs/en/config-files):

```
{
  "plugins": ["@compiled/babel-plugin-css-in-js"]
}
```

</details>

### TypeScript compiler

Using either `tsc` directly,
`ts-loader` with webpack,
or the default Parcel configuration with TypeScript.

<details>
  <summary>Click to expand...</summary>

We use TypeScript transformers to control the transformation -
strong suggestion to [read the handbook](https://github.com/madou/typescript-transformer-handbook) for getting started with them.

```sh
npm i @compiled/ts-transform-css-in-js
npm i ttypescript
```

> **Why do I need `ttypescript`?**
>
> Good question!
> Unfortunately TypeScript doesn't come with support out-of-the-box to add transformers.
> `ttypescript` enables you to do just that -
> it has a peer dependency on TypeScript so you can use whatever version you want.
> Read about [consuming transformers here](https://github.com/madou/typescript-transformer-handbook/blob/master/translations/en/transformer-handbook.md#consuming-transformers).

Next add the transformer to your `tsconfig.json` plugins:

```diff
{
  "compilerOptions": {
+    "plugins": [{ "transform": "@compiled/ts-transform-css-in-js" }]
  }
}
```

Then it's just a matter of modifying what you're using to compile your code.

#### TypeScript CLI

Using `tsc` directly?
Just switch it out for `ttsc` -
the `ttypescript` equivalent.

```diff
-tsc
+ttsc
```

#### Webpack

Using Webpack?
Add `ttypescript` as the compiler.

```diff
{
  loader: require.resolve('ts-loader'),
  options: {
+    compiler: 'ttypescript',
  },
},
```

#### Parcel

Using Parcel?
Just install the `ttypescript` plugin and you're done!

```sh
npm i parcel-plugin-ttypescript --save-dev
```

</details>

## Usage

### `css` prop

```jsx
import '@compiled/css-in-js';

<div css={{ fontSize: 12 }} />;
```

### `styled` component

```jsx
import { styled } from '@compiled/css-in-js';

styled.div`
  font-size: 12px;
`;
```

### `ClassNames` component

```jsx
import React from 'react';
import { ClassNames } from '@compiled/css-in-js';

<ClassNames>{({ css }) => <div className={css({ fontSize: 12 })} />}</ClassNames>;
```
