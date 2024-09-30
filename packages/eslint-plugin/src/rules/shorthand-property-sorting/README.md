# `shorthand-property-sorting`

Enforces css property sorting for packages `css`, `cssMap`, `styled` that originates from `@compiled/react`, and `xcss` from `@atlaskit/primitives`.

When using both shorthand and longhand properties, compiled scrambles the properties and it is unintuative to understand which properties override which others. Ordering the shorthand first ensures that longhand always overrides shorthand.

---

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { css } from '@compiled/react';

const styles = css({
  borderColor: 'red',
  border: '1px solid black',
});
```

👍 Examples of **correct** code for this rule:

```js
import { css } from '@compiled/react';

const styles = css({
  border: '1px solid black',
  borderColor: 'red',
});
```
