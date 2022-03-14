# `no-css-tagged-template-expression`

Disallows any `css` tagged template expressions that originate from `@compiled/react`.

Tagged template expressions are difficult to parse correctly (which can lead to more frequent build failures or invalid CSS generation), have limited type safety, and lack syntax highlighting. These problems can be avoided by using the preferred call expression syntax instead.

---

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
