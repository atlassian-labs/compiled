# `jsx-pragma`

Ensure that the Compiled JSX pragma is set when using the `css` prop.

A JSX pragma is a comment that declares where to import the JSX namespace from. It looks
like one of the following:

```js
/** @jsx jsx */
import { jsx } from '@compiled/react';
```

```js
/** @jsxImportSource @compiled/react */
import { jsx } from '@compiled/react';
```

For all Compiled usages, one of these should be used. See the
[Emotion documentation](https://emotion.sh/docs/css-prop#jsx-pragma) for more details
on how JSX pragmas work.

---

The `--fix` option on the command line automatically fixes problems reported by this rule.

## Rule details

👎 Examples of **incorrect** code for this rule:

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

```js
// [{ "detectConflictWithOtherLibraries": true }]

/** @jsx jsx */
import { css } from '@compiled/react';
import { jsx } from '@emotion/react';

<div css={css({ display: 'block' })} />;
          ^^^ cannot mix Compiled and Emotion
```

👍 Examples of **correct** code for this rule:

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

```js
// [{ "onlyRunIfImportingCompiled": true }]

import { css } from '@emotion/react';
<div css={css({ display: 'block' })} />;
```

```js
// [{ "onlyRunIfImportingCompiled": true }]

<div css={{ display: 'block' }} />
```

## Options

This rule supports the following options:

### `runtime: 'classic' | 'automatic`

What [JSX runtime](https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html) to adhere to,
defaults to automatic.

### `detectConflictWithOtherLibraries: boolean`

Raises a linting error if `css` or `jsx` is imported from `@emotion/react` (or `@emotion/core`) in the same file
as a Compiled import.

This is important as Emotion can't be used with Compiled in the same file, and ignoring this linting error will
result in a confusing runtime error. This defaults to `true`.

### `onlyRunIfImportingCompiled: boolean`

By default, the `jsx-pragma` rule suggests adding the Compiled JSX pragma whenever the `css` attribute is being
used. This may not be ideal if your codebase uses a mix of Compiled and other libraries (e.g. Emotion,
styled-components). Setting `onlyRunIfImportingCompiled` to true turns off this rule unless `css` or `cssMap`
are imported from `@compiled/react`.

This option defaults to `false`.
