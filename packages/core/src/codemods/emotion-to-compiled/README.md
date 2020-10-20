# emotion-to-compiled

> Codemod for easy migration from emotion.

```bash
# https://github.com/facebook/jscodeshift#usage-cli
npx jscodeshift --parser=tsx --extensions=tsx --transform node_modules/@compiled/core/dist/codemods/emotion-to-compiled src
```

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
/** @jsx jsx */
import react from 'react';
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
import react from 'react';
import { styled } from '@compiled/core';

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

## Caveats

### Generating CSS at runtime

If you are generating CSS at runtime, you'll have to do conversion manually. Check out [the docs](https://compiledcssinjs.com/docs/migrating#generating-css-at-runtime) which explains why this conversion is necessary.

Please convert this code:

```javascript
import styled from '@emotion/styled';

const getBackgroundGradient = (color, percent) => ({
  background: `linear-gradient(${color}, ${color}) 0 / ${percent}% 100% no-repeat
      ${color}`,
});

styled.input`
  ＄{(props) => getBackgroundGradient(props.color, props.percent)}
`;
```

as below before you run this codemod:

```javascript
import styled from '@emotion/styled';

const getBackgroundGradient = (color, percent) => ({
  `linear-gradient(${color}, ${color}) 0 / ${percent}% 100% no-repeat
      ${color}`,
});

styled.input`
  background: ＄{props => getBackgroundGradient(props.color, props.percent)};
`;
```
