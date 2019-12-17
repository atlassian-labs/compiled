# untitled-css-in-js-project

Typescript first css-in-js library that compiles away all your problems.
Inspired by the `css` prop and zero config SSR of [Emotion](https://emotion.sh),
the zero runtime of [Linaria](https://linaria.now.sh),
and the `styled` api from [Styled Components](https://www.styled-components.com) to create _the_ css-in-js solution for component libraries. No runtime,
server side rendering out-of-the-box,
made for component libraries.

Currently in initial development -
Typescript transformer first,
Babel plugin later.

## `css` prop

Transforms:

```jsx
<div css={{ color: 'blue' }}>hello, world!</div>
```

Into:

```jsx
<>
  <style>{'.a { color: blue; }'}</style>
  <div className="a">hello, world!</div>
</>
```

## `styled` component

Transforms:

```jsx
const Item = styled.div`
  color: blue;
`;
```

Into:

```jsx
const Item = props => (
  <>
    <style>{'.a { color: blue; }'}</style>
    <div className="a">{props.children}</div>
  </>
);
```

## `ClassNames` component

Transforms:

```jsx
<ClassNames>{({ css }) => <div className={css({ color: 'blue' })}>hello, world!</div>}</ClassNames>
```

To:

```jsx
<>
  <style>{'.a { font-size: 20px; }'}</style>
  <div className="a">hello, world!</div>
</>
```

## Dynamic behaviour

Dynamic behaviour is powered by CSS variables,
which can be applied to every api described so far.

If we take the `css` prop example it would look like...

Transforms:

```jsx
const [color] = useState('blue');

<div css={{ color }}>hello, world!</div>;
```

Into:

```jsx
const [color] = useState('blue');

<>
  <style>{'.a { color: var(--color-a); }'}</style>
  <div className="a" style={{ '--color-a': color }}>
    hello, world!
  </div>
</>;
```
