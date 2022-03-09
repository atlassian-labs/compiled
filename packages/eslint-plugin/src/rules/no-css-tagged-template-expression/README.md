# `no-css-tagged-template-expression`

Disallows tagged template expressions used with `css` from `@compiled/react`.

The `--fix` option on the command line automatically fixes problems reported by this rule.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { css } from '@compiled/react';

css`
  color: blue;
`;

const styles = css`
  color: blue;
  font-weight: 500;
`;
```

👍 Examples of **correct** code for this rule:

```js
import { css } from '@compiled/react';

css({ color: 'blue' });

const styles = css({
  color: 'blue',
  fontWeight: 500,
});
```

## Limitations

- Comments are not fixable
