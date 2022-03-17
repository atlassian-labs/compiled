# `no-emotion-css`

Ensures usage of the `@compiled/react` library over `@emotion/core` or `@emotion/styled`.

The `--fix` option on the command line automatically fixes problems reported by this rule.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { css } from '@emotion/core';
import styled from '@emotion/styled';
```

```js
/** @jsx jsx */
import { jsx } from '@emotion/core';
```

👍 Examples of **correct** code for this rule:

```js
import { css } from '@compiled/react';

import { styled } from '@compiled/react';

import { css, styled } from '@compiled/react';
```
