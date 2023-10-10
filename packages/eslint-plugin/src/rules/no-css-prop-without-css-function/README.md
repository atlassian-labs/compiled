# `no-css-prop-without-css-function`

Disallows `css` prop usages without wrapping in the `css` import from `@compiled/react`

Using the CSS import also improves readability and type-safety, as errors will show on the wrapped object directly, rather than when referenced by the css prop. Static analysis is also much easier as the tool can know if a code block is a Compiled style.

When defining a CSS prop value, CSS-in-JS libraries often will not be able to figure out which library you want to use. This can cause undefined behaviour depending on how the bundler visits the file.

This rule also forbids using the `css` props with a value that Compiled cannot determine at build time, as listed below. These are situations that would cause Compiled to error at build time, or undefined behaviour if Compiled is used alongside another library (e.g. styled-components).

- imported values
- function parameters/props
- value that uses an undefined variable

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

👎 Examples of **incorrect** code for this rule:

```js
import React from 'react';

const CoolComponent = ({ styles }) => {
  return <MyComponent css={styles} />;
};
```

👍 Examples of **correct** code for this rule:

```js
import React from 'react';
import { css } from '@compiled/react';

const CoolComponent = () => {
  const styles = css({
    color: 'red';
  });

  return <MyComponent css={styles} />;
}
```
