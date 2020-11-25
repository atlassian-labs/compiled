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

- Bump up `@compiled/react` to x.x.x version.
- Ensure `@compiled/cli` is also running with the same version: `npx @compiled/cli@x.x.x --preset codemods`
  - Use `npx @compiled/cli --preset codemods` if `@compiled/react` is bumped up to the latest version.
