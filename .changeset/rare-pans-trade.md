---
'@compiled/babel-plugin': patch
---

Previously, if you passed `props => ...` directly to `styled.div` or `css()`, and the return value of the arrow function was an object, you would cause `@compiled/babel-plugin` to crash:

```tsx
import { styled } from '@compiled/react';
import React from 'react';

const Component = styled.div(props => ({
  color: `${props.customColor}`,
  background: props.background,
}));
```

While at the same time, wrapping the return value inside a logical expression or ternary expression would make it work perfectly fine:

```tsx
const Styles = styled.div(
  (props) => (props.isEditing ? {} : { backgroundColor: props.highlightColor }),
);
```

With this version, both of these forms will work without issue. :)
