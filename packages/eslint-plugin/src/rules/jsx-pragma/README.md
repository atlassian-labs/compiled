# @compiled/eslint-plugin/jsx-pragma

Enforce a jsx pragma is set when using the `css` prop.
The `--fix` option [on the command line] automatically fixes problems reported by this rule.

## Fail

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

## Pass

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

## Options

This rule supports the following options:

### `runtime: 'classic' | 'automatic`

What [JSX runtime](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) to adhere to,
defaults to automatic.
