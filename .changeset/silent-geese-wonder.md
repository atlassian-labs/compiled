---
'@compiled/babel-plugin': minor
---

Throw an error when compiling a `cssMap` object where we expect a `css` or nested `cssMap` object.

Example of code that silently fails today, using `styles` directly:

```tsx
import { cssMap } from '@compiled/react';
const styles = cssMap({ root: { padding: 8 } });
export default () => <div css={styles} />;
```

What we expect to see instead, using `styles.root` instead:

```tsx
import { cssMap } from '@compiled/react';
const styles = cssMap({ root: { padding: 8 } });
export default () => <div css={styles.root} />;
```
