# styled-components-to-compiled

> Codemod for easy migration from styled components.

## Usage

### Using `jscodeshift`

```bash
# https://github.com/facebook/jscodeshift#usage-cli
npx jscodeshift --parser=tsx --extensions=tsx --transform node_modules/@compiled/css-in-js/dist/codemods/styled-components-to-compiled src
```

### Using `@compiled/cli`

```bash
npx @compiled/cli --preset codemods
# and follow the instructions
```

How instructions looks like (when run without `--preset codemods`. Please run it with `--preset codemods` for fast access):

![styled-components-to-compiled cli](./assets/styled-components-to-compiled-cli.gif)

_NOTE: Use `npx @compiled/cli` instead of `npx compiled-css-in-js` (which is shown in image)_

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
import styled from 'styled-components';
```

Is transformed to:

```javascript
import { styled } from '@compiled/css-in-js';
```

## Caveats

### Generating CSS at runtime

If you are generating CSS at runtime, you'll have to do conversion manually. Check out [the docs](https://compiledcssinjs.com/docs/migrating#generating-css-at-runtime) which explains why this conversion is necessary.

Please convert such code:

```javascript
import styled from 'styled-components';

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
import styled from 'styled-components';

const getBackgroundGradient = (color, percent) => ({
  `linear-gradient(${color}, ${color}) 0 / ${percent}% 100% no-repeat
      ${color}`,
});

styled.input`
  background: ＄{props => getBackgroundGradient(props.color, props.percent)};
`;
```
