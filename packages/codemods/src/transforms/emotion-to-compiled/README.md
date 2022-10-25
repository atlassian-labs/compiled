# emotion-to-compiled

> Codemod for easy migration from emotion.

## Usage

Codemods in this repository can be run with the [CodeshiftCommunity](https://www.codeshiftcommunity.com/docs/) tooling.

```bash
# Transform single file
npx @codeshift/cli --packages "@compiled/codemods#emotion-to-compiled" /Project/path/to/file

# Transform multiple files
npx @codeshift/cli --packages "@compiled/codemods#emotion-to-compiled" /Project/**/*.tsx
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
