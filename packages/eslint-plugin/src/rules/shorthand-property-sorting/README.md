# `shorthand-property-sorting`

Enforces css property sorting for packages `css`, `cssMap`, `styled` that originates from `@compiled/react`, and `xcss` from `@atlaskit/primitives`.

At build time, Compiled automatically sorts shorthand properties (like `font` and `border`) so that they come before any longhand properties (like `fontSize` and `borderTopColor`) defined on the component. This means that longhand properties will always override shorthand properties.

This rule enforces that the order in which the properties appear in a component's source code matches the actual ordering the properties will have at build time and runtime.

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
