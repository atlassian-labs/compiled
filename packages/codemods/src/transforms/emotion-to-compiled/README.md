# emotion-to-compiled

> Codemod for easy migration from emotion.

## Usage

Codemods in this repository can be run with the [Hypermod CLI](https://www.hypermod.io/docs/tools/cli) tooling.

```bash
# Transform single file
npx @hypermod/cli --packages "@compiled/codemods#emotion-to-compiled" /Project/path/to/file

# Transform multiple files
npx @hypermod/cli --packages "@compiled/codemods#emotion-to-compiled" /Project/**/*.tsx
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

## Gotchas

Some imports from Emotion are unsupported in Compiled. These imports will not be migrated by the codemod and will need to be manually removed.

Example:

```javascript
// Before
import { ClassNames, CSSObject, css as c, jsx } from '@emotion/core';

// After
import { CSSObject } from '@emotion/core';

import { ClassNames, css as c } from '@compiled/react';
```
