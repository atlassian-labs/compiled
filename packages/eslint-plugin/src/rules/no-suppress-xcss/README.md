# `no-suppress-xcss`

Disallows supressing type violations when using the xcss prop.

👎 Examples of **incorrect** code for this rule:

```js
// @ts-expect-error
<Button xcss={{ fill: 'var(--ds-text)' }} />
```

👍 Examples of **correct** code for this rule:

```js
<Button xcss={{ color: 'var(--ds-text)' }} />
```
