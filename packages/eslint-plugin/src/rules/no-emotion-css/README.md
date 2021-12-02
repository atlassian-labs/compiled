# @compiled/eslint-plugin/emotion-to-compiled

Ensures usage of the `@compiled/react` library over `@emotion/core` or `@emotion/styled`.
The `--fix` option [on the command line] automatically fixes problems reported by this rule.

## Fail

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

## Pass

```js
import { styled } from '@compiled/react';
```

```js
import { css } from '@compiled/react';
```
