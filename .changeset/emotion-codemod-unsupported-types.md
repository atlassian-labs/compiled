---
'@compiled/codemods': minor
---

The `emotion-to-compiled` codemod now handles `Interpolation` and `CSSProperties` imports from `@emotion/core` / `@emotion/react`.

Previously these type-only imports were silently left behind so the migrated file still pulled in `@emotion/*` (and so wouldn't compile cleanly without manual cleanup). The codemod now:

- replaces every usage of the unsupported type with `any`,
- adds a `TODO(@compiled/react codemod): …` block comment above the enclosing statement so the developer can pick a Compiled-compatible alternative,
- removes the now-unused import specifier, and removes the emotion import entirely if no other specifiers remain.

Closes #898.

**Example**

```ts
// Before
import { css, Interpolation } from '@emotion/core';

const styles: Interpolation = css`
  color: red;
`;
```

```ts
// After
import { css } from '@compiled/react';

/* TODO(@compiled/react codemod): Compiled does not provide an equivalent for "Interpolation" from "@emotion/core". This type has been replaced with `any` — replace it with a Compiled-compatible alternative when migrating. */
const styles: any = `color: red`;
```
