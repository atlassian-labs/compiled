---
'@compiled/babel-plugin': patch
'@compiled/react': patch
---

The `css` mixin API is now available,
functioning similarly to the [emotion equivalent](https://emotion.sh/docs/composition).

```jsx
import { css } from '@compiled/react';

<div
  css={css`
    display: flex;
    font-size: 50px;
    color: blue;
  `}>
  blue text
</div>;
```

For more help, read the docs: https://compiledcssinjs.com/docs/css.
