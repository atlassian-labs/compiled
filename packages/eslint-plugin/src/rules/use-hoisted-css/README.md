# `use-hoisted-css`

Disallows/discourages implementation of CSS styles directly within the `css` property of JSX elements. This form of styling is not recommended as it discourages use of dynamic styling which may be required.

---

## Rule details

👎 Examples of **incorrect** code for this rule:

```javascript
<div css={{ color: 'red' }}>
<div css={css({ color: 'red' })}>
```

👍 Examples of **correct** code for this rule:

```javascript
const styles = css({ color: token('color.text.danger') });
const disabledStyles = css({ color: token('color.text.disabled') });

<div css={styles}>
<div css={props.disabled ? disabledStyles : baseStyles}>
```
