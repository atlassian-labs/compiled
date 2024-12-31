---
'@compiled/babel-plugin': minor
---

Fix `@compiled/babel-plugin` to not require `cssMap()` to be called prior to use.

Example, this failed before for no reason other than the fact that our `state.cssMap` was generated _after_ `JSXElement` and `JSXOpeningElement` were ran.

```tsx
import { cssMap } from '@compiled/react';
export default () => <div css={styles.root} />;
const styles = cssMap({ root: { padding: 8 } });
```
