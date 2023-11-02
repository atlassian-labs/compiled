# `local-cx`

This rule ensures the `cx()` function is only used within the `xcss` prop.

👎 Examples of **incorrect** code for this rule:

```js
const styles = cx({ color: 'red' })

<Button xcss={styles} />
```

👍 Examples of **correct** code for this rule:

```js
<Button xcss={cx({ color: 'red' })} />
```
