# `no-keyframes-tagged-template-expression`

Disallows any `keyframes` tagged template expressions that originate from `@compiled/react`.

Tagged template expressions are difficult to parse correctly (which can lead to more frequent build failures or invalid CSS generation), have limited type safety, and lack syntax highlighting. These problems can be avoided by using the preferred call expression syntax instead.

---

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
