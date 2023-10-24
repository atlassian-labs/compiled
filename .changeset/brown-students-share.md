---
'@compiled/babel-plugin': patch
'@compiled/react': patch
---

The xcss prop is now available.
Declare styles your component takes with all other styles marked as violations
by the TypeScript compiler. There are two primary use cases for xcss prop:

- safe style overrides
- inverting style declarations

Interverting style declarations is interesting for platform teams as
it means products only pay for styles they use as they're now the ones who declare
the styles!

The `XCSSProp` type has generics which must be defined — of which should be what you
explicitly want to maintain as API. Use `XCSSAllProperties` and `XCSSAllPseudos` types
to enable all properties and pseudos.

```tsx
import { type XCSSProp } from '@compiled/react';

interface MyComponentProps {
  // Color is accepted, all other properties / pseudos are considered violations.
  xcss?: XCSSProp<'color', never>;

  // Only backgrond color and hover pseudo is accepted.
  xcss?: XCSSProp<'backgroundColor', '&:hover'>;

  // All properties are accepted, all pseudos are considered violations.
  xcss?: XCSSProp<XCSSAllProperties, never>;

  // All properties are accepted, only the hover pseudo is accepted.
  xcss?: XCSSProp<XCSSAllProperties, '&:hover'>;
}

function MyComponent({ xcss }: MyComponentProps) {
  return <div css={{ color: 'var(--ds-text-danger)' }} className={xcss} />;
}
```

The xcss prop works with static inline objects and the [cssMap](https://compiledcssinjs.com/docs/api-cssmap) API.

```tsx
// Declared as an inline object
<Component xcss={{ color: 'var(--ds-text)' }} />;

// Declared with the cssMap API
const styles = cssMap({ text: { color: 'var(--ds-text)' } });
<Component xcss={styles.text} />;
```

To concatenate and conditonally apply styles use the `cssMap` and `cx` functions.
