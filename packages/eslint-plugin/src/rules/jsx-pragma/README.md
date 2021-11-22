# @compiled/eslint-plugin/jsx-pragma

This rule ensures a jsx pragma is used when using CSS prop.
You can configure which jsx pragma to use via the `runtime` option (either classic or automatic).
Defaults to automatic.

## Examples

👎 Example of **incorrect** code for this rule:

```js
// [{ "pragma": "jsx" }]
/** @jsx jsx */
    ^^^^^^^^ should use jsxImportSource pragma
import { jsx } from '@compiled/react';
```

```js
// [{ "pragma": "jsxImportSource" }]
/** @jsxImportSource @compiled/react */
    ^^^^^^^^^^^^^^^^ should use jsx pragma
import { jsx } from '@compiled/react';
```

```js
// [{ "pragma": "jsxImportSource" }]
import '@compiled/react';

<div css={{ display: 'block' }} />;
     ^^^ missing pragma
```

👍 Example of **correct** code for this rule:

```js
// [{ "pragma": "jsx" }]
/** @jsx jsx */
import { jsx } from '@compiled/react';

<div css={{ display: 'block' }} />;
```

```js
// [{ "pragma": "jsxImportSource" }]
/** @jsxImportSource @compiled/react */

<div css={{ display: 'block' }} />
```
