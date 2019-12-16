# untitled-css-in-js-project

Typescript first css-in-js library that compiles away all your problems.
Inspired by the `css` prop and zero config SSR of [Emotion](https://emotion.sh),
the zero runtime of [Linaria](https://linaria.now.sh),
and the `styled` api from [Styled Components](https://www.styled-components.com) to create _the_ css-in-js solution for component libraries.

No runtime,
server side rendering out-of-the-box,
made for component libraries.
In initial development.

## `css` prop

Transforms:

```jsx
<div css={{ fontSize: '20px' }}>hello, world!</div>
```

Into:

```jsx
<>
  <style>{'.a { font-size: 20px; }'}</style>
  <div className="a">hello, world!</div>
</>
```

## `styled` component

Transforms:

```jsx
const Item = styled.div`
  font-size: 20px;
`;
```

Into:

```jsx
const Item = props => (
  <>
    <style>{'.a { font-size: 20px; }'}</style>
    <div className="a">{props.children}</div>
  </>
);
```

## `ClassNames` component

Transforms:

```jsx
<ClassNames>
  {({ css }) => <div className={css({ fontSize: '20px' })}>hello, world!</div>}
</ClassNames>
```

To:

```jsx
<>
  <style>{'.a { font-size: 20px; }'}</style>
  <div className="a">hello, world!</div>
</>
```
