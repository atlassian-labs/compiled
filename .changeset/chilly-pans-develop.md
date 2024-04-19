---
'@compiled/react': minor
---

`XCSSProp` now accepts an object as the first generic TAllowedProperties, in addition to the existing string union type.
This allows you to restrict both the properties and values that can be used in `xcss`:

Note: when TAllowedProperties is set to an object, the required properties and pseudos for XCSSProp are determined automatically (requiredProperties is set to `never`).

```tsx
import { type XCSSProp } from '@compiled/react';

interface MyComponentProps {
  // Color is accepted, and only takes the specified value. All other properties are considered violations.
  xcss?: XCSSProp<{ color?: 'var(--ds-text-danger)' }, never>;

  // Color is required, while `backgroundColor` is optional.
  xcss?: XCSSProp<
    {
      color: 'var(--ds-text-danger)';
      backgroundColor?: 'var(--ds-background-neutral)' | 'var(--ds-background-brand)';
    },
    never
  >;

  // Pseudos can have their own properties and values set.
  xcss?: XCSSProp<
    {
      backgroundColor?: 'var(--ds-background-neutral)';
      '&:hover': {
        backgroundColor?: 'var(--ds-background-neutral-hovered)';
      };
    },
    never
  >;
}

function MyComponent({ xcss }: MyComponentProps) {
  return <div css={{ color: 'var(--ds-text-danger)' }} className={xcss} />;
}
```
