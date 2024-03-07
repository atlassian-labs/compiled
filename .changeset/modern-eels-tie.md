---
'@compiled/react': patch
---

- The CSS map API now allows defining top level media queries. Previously you had to define them inside a `@media` object, this restriction has now been removed bringing it inline with the CSS function API.
- The XCSS prop and strict API types now allow defining and using media queries.

**XCSS prop**

The XCSS prop now takes top level media queries. Nested media queries is not allowed.

```jsx
import { cssMap, css } from '@compiled/react';

const styles = cssMap({
  valid: { '@media (min-width: 30rem)': { color: 'green' } },
  invalid: { '@media': { '(min-width: 30rem)': { color: 'red' } } },
});

<Component xcss={styles.valid} />;
```

**createStrictAPI**

Now takes an optional second generic to define what media queries are supported:

```diff
createStrictAPI<
  { color: 'var(--text)' }
+  '(min-width: 30rem)' | '(min-width: 48rem)'
>();
```

Which is then flushed to all output APIs.
