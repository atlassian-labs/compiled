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

`styled.div.attrs` spread properties are not supported.

_Example_

```
styled.div.attrs({
    style: ({ left, ...props }) => {
        left: left,
        top: props.top,
    }
})`
    position: absolute;
`;
```
