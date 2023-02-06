# `no-css-prop-without-css-function`

Disallows `css` prop usages without wrapping in the `css` import from `@compiled/react`

Using the CSS import also improves readability and type-safety, as errors will show on the wrapped object directly, rather than when referenced by the css prop. Static analysis is also much easier as the tool can know if a code block is a Compiled style.

When defining a CSS prop value, CSS-in-JS libraries often will not be able to figure out which library you want to use. This can cause undefined behaviour depending on how the bundler visits the file.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import React from 'react';

const styles = { color: 'red' };

const Component = () => <div css={styles} />;
```

👍 Examples of **correct** code for this rule:

```js
import React from 'react';
import { css } from '@compiled/react';

const styles = css({ color: 'red' });

const Component = () => <div css={styles} />;
```

👎 Examples of **incorrect** code for this rule:

```js
import React from 'react';

const styles = `color: 'red'`;

const Component = () => <div css={styles} />;
```

👍 Examples of **correct** code for this rule:

```js
import React from 'react';
import { css } from '@compiled/react';

const styles = css`
  color: 'red';
`;

const Component = () => <div css={styles} />;
```
