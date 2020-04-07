# 👷‍♀ ‍[Compiled](https://compiledcssinjs.com/)

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

## Browser support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Safari | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari-ios/safari-ios_48x48.png" alt="iOS Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>iOS Safari |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IE11 ⚠️, Edge                                                                                                                                                                                                   | last 2 versions                                                                                                                                                                                                   | last 2 versions                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                                               |

⚠️ IE11 is partially supported.
Compiled uses CSS variables for dynamic properties so unless you enable a ponyfill such as [`css-vars-ponyfill`](https://github.com/jhildenbiddle/css-vars-ponyfill) you won't be able to use them.
Alternatively you can define static selectors and conditionally apply them in your code.

## Local development

Compiled is a monorepo - where we deliver multiple small packages instead of one big package.
You'll find them in the `packages` folder.
Want to make changes to the website?
[You'll find it here](https://github.com/compiled/website).

### Packages of note

- `css-in-js` - entrypoint for consumers of Compiled - has a small amount of runtime code that blows up without the transformer enabled
- `ts-transform` - main bulk of Compiled's code - it transforms consumer code into Compiled components
- `babel-plugin` - thin wrapper around `ts-transform` to enable Babel environments to consume Compiled
- `jest` - jest matcher to make testing Compiled css easier
- `style` - small component to reconcile moving styles to the head of the document at runtime

### Tests

We use Jest for tests.
Find the folder you want to make changes to,
and run that subset of tests.
For example:

```bash
yarn test packages/ts-transform/src/css-prop --watch
```

### Storybook

```bash
yarn start
```

# Contributing

Thank you for considering a contribution to Compiled!
Before doing so,
please make sure to read our [contribution guidelines](/CONTRIBUTING.md).

[![Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://atlassian.com)
