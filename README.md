# @compiled/css-in-js

> Typescript first CSS in JS library that compiles away to nothing 🔧🚧

Inspired by the `css` prop and zero config SSR of [Emotion](https://emotion.sh),
the zero runtime of [Linaria](https://linaria.now.sh),
and the `styled` api from [Styled Components](https://www.styled-components.com) to create _the_ css-in-js solution for component libraries.

- 🙅 No runtime (but actually no runtime)
- 🌍 Run anywhere with zero config (server side rendering out-of-the-box)
- ⛓️ Optional transformer to extract styles to stylesheets
- 📦 Made for consumers consumers (developers who consume your components)

Currently in initial development.
Reach out to me [@itsmadou](https://twitter.com/itsmadou) if this sounds interesting to you.

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
    <style>{'.a { font-size: 20px; }'}</style>
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
