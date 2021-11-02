# @compiled/eslint-plugin/emotion-to-compiled

Ensures usage of the `@compiled/react` library over `@emotion/core` or `@emotion/styled`.
This rule acts as a form of codemod.

## Examples

👎 Example of **incorrect** code for this rule:

```js
import styled from '@emotion/styled';
                     ^^^^^^^^^
```

```js
import { css } from '@emotion/core';
                     ^^^^^^^^^
```

```js
/** @jsx jsx */
   ^^^^^^^^^
import { jsx } from '@emotion/core';
                     ^^^^^^^^^
```

👍 Example of **correct** code for this rule:

```js
import { styled } from '@compiled/react';
```

```js
import { css } from '@compiled/react';
```
