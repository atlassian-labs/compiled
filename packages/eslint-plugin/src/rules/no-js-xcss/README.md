# `no-js-xcss`

Disallows using xcss prop inside JavaScript files.

Components that use xcss prop have explicitly declared what styles via the type system they should and should not accept, consumers must adhere to this API. Without TypeScript it's impossible to ensure this is met.

👎 Examples of **incorrect** code for this rule:

```js
// my-component.jsx
<Button xcss={{ fill: 'var(--ds-text)' }} />
```

👍 Examples of **correct** code for this rule:

```js
// my-component.tsx
<Button xcss={{ color: 'var(--ds-text)' }} />
```
