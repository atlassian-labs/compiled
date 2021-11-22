# @compiled/eslint-plugin/jsx-pragma

This rule ensures a jsx pragma is used when using CSS prop.
You can configure which jsx pragma to use (either `jsx` or `jsxImportSource`) via configuration,
defaults to `jsxImportSource`.

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
^^^ missing pragma
import '@compiled/react';

<div css={{ display: 'block' }} />;
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
