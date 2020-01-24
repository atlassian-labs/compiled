# @compiled/css-in-js

Inspired by the `css` prop and zero config SSR of [Emotion](https://emotion.sh),
the zero runtime of [Linaria](https://linaria.now.sh),
and the `styled` api from [Styled Components](https://www.styled-components.com) to create _the_ css-in-js solution for component libraries.

Currently in initial development.
Reach out to me [@itsmadou](https://twitter.com/itsmadou) if this sounds interesting to you.

## Installation

We use Typescript transformers to control the transformation -
strong suggestion to [read the handbook](https://github.com/madou/typescript-transformer-handbook) for getting started with them.

Install `compiled` and `ttypescript`:

```sh
npm i @compiled/css-in-js --save
npm i ttypescript --save-dev
```

> **Why do I need `ttypescript`?**
>
> Good question!
> Unfortunately Typescript doesn't come with support out-of-the-box to add transformers.
> `ttypescript` enables you to do just that -
> it has a peer dependency on Typescript so you can use whatever version you want.
> Read about [consuming transformers here](https://github.com/madou/typescript-transformer-handbook/blob/master/translations/en/transformer-handbook.md#consuming-transformers).

Next add the transformer to your `tsconfig.json` plugins:

```diff
{
  "compilerOptions": {
+    "plugins": [{ "transform": "@compiled/css-in-js/dist/ts-transformer" }]
  }
}
```

Then it's just a matter of modifying what you're using to compile your code.

### Typescript CLI

Using `tsc` directly?
Just switch it out for `ttsc` -
the `ttypescript` equivalent.

```diff
-tsc
+ttsc
```

### Webpack

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

### Parcel

Using Parcel?
Just install the `ttypescript` plugin and you're done!

```sh
npm i parcel-plugin-ttypescript --save-dev
```

## Usage

### `css` prop

Transforms:

```jsx
import { jsx } from '@compiled/css-in-js';

() => <div css={{ color: 'blue' }}>hello, world!</div>;
```

Into:

```jsx
() => (
  <>
    <style>{'.a { color: blue; }'}</style>
    <div className="a">hello, world!</div>
  </>
);
```

### `styled` component

Transforms:

```jsx
import { styled } from '@compiled/css-in-js';

styled.div`
  color: blue;
`;
```

Into:

```jsx
props => (
  <>
    <style>{'.a { color: blue; }'}</style>
    <div className="a">{props.children}</div>
  </>
);
```

### `ClassNames` component

Transforms:

```jsx
import { ClassNames } from '@compiled/css-in-js';

() => (
  <ClassNames>
    {({ css }) => <div className={css({ color: 'blue' })}>hello, world!</div>}
  </ClassNames>
);
```

To:

```jsx
() => (
  <>
    <style>{'.a { color: blue; }'}</style>
    <div className="a">hello, world!</div>
  </>
);
```

## Dynamic behaviour

Dynamic behaviour is powered by CSS variables,
which can be applied to every api described so far.

If we take the `css` prop example it would look like...

Transforms:

```jsx
const [color] = useState('blue');

() => <div css={{ color }}>hello, world!</div>;
```

Into:

```jsx
const [color] = useState('blue');

() => (
  <>
    <style>{'.a { color: var(--color-a); }'}</style>
    <div className="a" style={{ '--color-a': color }}>
      hello, world!
    </div>
  </>
);
```
