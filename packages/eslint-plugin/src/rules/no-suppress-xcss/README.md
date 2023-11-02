# `no-suppress-xcss`

Disallows supressing type violations when using the xcss prop. Supressing type violations will cause incidents and unexpected behaviour when code changes in the future.

Components that use xcss prop have explicitly declared what styles they should and should not accept, consumers must adhere to this API.

👎 Examples of **incorrect** code for this rule:

```js
// @ts-expect-error
<Button xcss={{ fill: 'var(--ds-text)' }} />
```

👍 Examples of **correct** code for this rule:

```js
<Button xcss={{ color: 'var(--ds-text)' }} />
```
