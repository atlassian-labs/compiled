---
'@compiled/babel-plugin': patch
'@compiled/react': patch
---

Introduce new API `createStrictAPI` which returns a strict subset of Compiled APIs augmented by a type definition.
This API does not change Compileds build time behavior — merely augmenting
the returned API types which enforce:

- all APIs use object types
- property values declared in the type definition must be used (else fallback to defaults)
- a strict subset of pseudo states/selectors
- unknown properties to be a type violation

To set up:

1. Declare the API in a module (either local or in a package):

```tsx
import { createStrictAPI } from '@compiled/react';

// ./foo.ts
const { css, cssMap, XCSSProp, cx } = createStrictAPI<{
  color: 'var(--ds-text)';
  '&:hover': { color: 'var(--ds-text-hover)' };
}>();

// Expose APIs you want to support.
export { css, cssMap, XCSSProp, cx };
```

2. Configure Compiled to pick up this module:

```diff
// .compiledcssrc
{
+  "importSources": ["./foo.ts"]
}
```

3. Use the module in your application code:

```tsx
import { css } from './foo';

const styles = css({ color: 'var(--ds-text)' });

<div css={styles} />;
```
