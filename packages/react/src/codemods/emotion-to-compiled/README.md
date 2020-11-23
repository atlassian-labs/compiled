# emotion-to-compiled

> Codemod for easy migration from emotion.

## Usage

```bash
npx @compiled/cli --preset codemods
# and follow the instructions
```

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
/** @jsx jsx */
import styled from '@emotion/styled';
import { css, jsx } from '@emotion/core';

const Component = (props) => (
  <>
    <div
      css={css`
        color: red;
        background-color: #000;
      `}
    />
    <span
      css={css`
        color: blue;
      `}
    />
  </>
);
```

Is transformed to:

```javascript
import { styled } from '@compiled/react';

const Component = (props) => (
  <>
    <div
      css={`
        color: red;
        background-color: #000;
      `}
    />
    <span
      css={`
        color: blue;
      `}
    />
  </>
);
```

## Updating Instructions

When a new version of `@compiled/react` is released, Please update `@compiled/react` and `@compiled/cli` to the same new version simultaneously.
