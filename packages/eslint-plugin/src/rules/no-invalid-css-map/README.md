# `no-invalid-css-map`

Ensure that all usages of the `cssMap` API are valid, and enforces the format of the object that is passed to `cssMap`.

Please refer to [our documentation](https://compiledcssinjs.com/docs/api-cssmap) for more details and some examples.

This is intended to be used in conjunction with type checking (either through TypeScript or Flow).

## Rule Details

Examples of **incorrect** code for this rule:

```js
import React from 'react';
import { cssMap } from '@compiled/react';

// cssMap needs to be declared in the top-most scope
// (not within a function, class, etc.)

const Foo = () => {
  const bar = cssMap({
    danger: {
      color: 'red',
    },
  });
};
```

Examples of **correct** code for this rule:

```js
import React from 'react';
import { cssMap } from '@compiled/react';

const styles = cssMap({
  danger: {
    color: 'red',
    backgroundColor: 'red',
  },
  success: {
    color: 'green',
    backgroundColor: 'green',
  },
});
```

```js
import React from 'react';
import { cssMap } from '@compiled/react';

const bap = 'blue';

const styles = cssMap({
  danger: {
    color: bap,
  },
});
```

### Options

#### `allowedFunctionCalls`: [string, string][]

Normally, this ESLint rule forbids all function calls from being used inside the `cssMap(...)` function call. For example, this would be invalid using default settings:

```js
import React from 'react';
import { cssMap } from '@compiled/react';
import { token } from '@atlaskit/token';

const styles = cssMap({
  danger: {
    color: token('my-color'),
    backgroundColor: 'red',
  },
  success: {
    color: 'green',
  },
});
```

If you would like to whitelist certain functions (e.g. `token` from `@atlaskit/token`), you can include the names of the functions as part of the `allowedFunctionCalls` argument. Each function should be represented as a two-element array, with the first element being the module the function is from, and the second element being the name of the function.

```js
// .eslintrc.js

// ...
      rules: {
        '@compiled/no-invalid-css-map': [
          'error',
          {
            allowFunctionCalls: [
              ['@atlaskit/token', 'token'],
            ]
          },
        ],
        // ...
      },
// ...
```
