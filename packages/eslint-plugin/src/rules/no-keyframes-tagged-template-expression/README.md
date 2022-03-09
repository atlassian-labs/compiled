# `no-keyframes-tagged-template-expression`

Disallows tagged template expressions used with `keyframes` from `@compiled/react`.

The `--fix` option on the command line automatically fixes problems reported by this rule.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { keyframes } from '@compiled/react';

keyframes`to { opacity: 0 }`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;
```

👍 Examples of **correct** code for this rule:

```js
import { keyframes } from '@compiled/react';

keyframes({ to: { opacity: 0 } });

const fadeOut = keyframes({
  from: {
    opacity: 1,
  },
  to: {
    opacity: 0,
  },
});
```

## Limitations

- Comments are not fixable
