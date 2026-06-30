---
'@compiled/react': patch
---

Import the `JSX` namespace explicitly from `react` instead of relying on the global `JSX` namespace.

`@types/react@19` removed the global `JSX` namespace, which is now only exposed from the `react` package. Sourcing `JSX` via `import type { JSX } from 'react'` keeps the types working under both React 18 and React 19 type definitions, with no runtime change.
