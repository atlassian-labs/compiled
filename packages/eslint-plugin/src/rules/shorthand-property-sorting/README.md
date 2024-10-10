# `shorthand-property-sorting`

Enforces css property sorting for packages `css`, `cssMap`, `styled` that originates from `@compiled/react`, and `@atlaskit/css`.

Having a longhand (like `fontSize` and `borderTopColor`) before a shorthand (like `font` and `border`) is not valid CSS. While this is not usually a problem, it becomes a problem in Compiled where classes are generated for each CSS declaration and rules are then sorted at build time during stylesheet extraction. As a result, this could cause unwanted side effects when CSS longhands are redudant.

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
