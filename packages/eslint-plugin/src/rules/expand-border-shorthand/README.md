# `shorthand-property-sorting`

This ESLint rule enforces the expansion of CSS `border` shorthand property, into their longhand equivalents `borderStyle`, `borderWidth`, `borderColor`, for packages `css`, `cssMap`, `styled` that originates from `@compiled/react`, and `@atlaskit/css`.

This rule only targets `border` shorthand with 3 properties, and does not take cases like:

```js
const styles1 = css({
  border: '1px',
});
const styles2 = css({
  border: '1px solid',
});
```

into consideration.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
const styles = css({
  border: `1px solid black`,
});
```

👍 Examples of **correct** code for this rule:

```js
const styles = css({
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'black',
});
```
