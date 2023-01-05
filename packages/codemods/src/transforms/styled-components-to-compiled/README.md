# styled-components-to-compiled

> Codemod for easy migration from styled components.

## Usage

Codemods in this repository can be run with the [CodeshiftCommunity](https://www.codeshiftcommunity.com/docs/) tooling.

```bash
# Transform single file
npx @codeshift/cli --packages "@compiled/codemods#styled-components-to-compiled" /Project/path/to/file

# Transform multiple files
npx @codeshift/cli --packages "@compiled/codemods#styled-components-to-compiled" /Project/**/*.tsx
```

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
import styled from 'styled-components';
```

Is transformed to:

```javascript
import { styled } from '@compiled/react';
```

## Gotchas

### Unresolved imports

Some imports from styled components are unsupported in Compiled. These imports will not be migrated by the codemod and will need to be manually removed.

```javascript
// Before
import styled, {
  css,
  keyframes,
  createGlobalStyle,
  ThemeProvider,
  withTheme,
} from 'styled-components';

// After
import { createGlobalStyle, ThemeProvider, withTheme } from 'styled-components';
import { css, keyframes, styled } from '@compiled/react';
```

### Spread properties

`styled.div.attrs` spread properties are not supported.

```javascript
styled.div.attrs({
    style: ({ left, ...props }) => {
        left: left,
        top: props.top,
    }
})`
    position: absolute;
`;
```
