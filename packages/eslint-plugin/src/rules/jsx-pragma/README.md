# @compiled/eslint-plugin/jsx-pragma

This rule ensures a jsx pragma is used when using CSS prop.
You can configure which jsx pragma to use (either jsx or jsxImportSource) via configuration.

## Examples

👎 Example of **incorrect** code for this rule:

```js
/** @jsx jsx */
    ^^^^^^^^ should use jsxImportSource pragma
import { jsx } from '@compiled/react';
```

```js
/** @jsxImportSource @compiled/react */
    ^^^^^^^^^^^^^^^^ should use jsx pragma
import { jsx } from '@compiled/react';
```

```js
^^^ missing pragma
import '@compiled/react';

<div css={{ display: 'block' }} />;
```

👍 Example of **correct** code for this rule:

```js
/** @jsx jsx */
import { jsx } from '@compiled/react';

<div css={{ display: 'block' }} />;
```

```js
/** @jsxImportSource @compiled/react */

<div css={{ display: 'block' }} />
```
