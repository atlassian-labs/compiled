# @compiled/eslint-plugin/prefer-jsx-import-source-pragma

Prefers using the automatic jsx runtime over the classic jsx runtime.
Will flag any use of jsx pragma with a supplementary fixer to move to the jsx import source pragma.

## Examples

👎 Example of **incorrect** code for this rule:

```js
/** @jsx jsx */
    ^^^^^^^^
import { jsx } from '@compiled/react';
```

👍 Example of **correct** code for this rule:

```js
/** @jsxImportSource @compiled/react */
```
