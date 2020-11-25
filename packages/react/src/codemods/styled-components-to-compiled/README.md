# styled-components-to-compiled

> Codemod for easy migration from styled components.

## Usage

```bash
npx @compiled/cli --preset codemods
# and follow the instructions
```

**Will modify files in place, so make sure you can recover if it goes wrong!**

## Examples

```javascript
import styled from 'styled-components';
```

Is transformed to:

```javascript
import { styled } from '@compiled/react';
```

## Updating Instructions

- Bump up `@compiled/react` to x.x.x version.
- Ensure `@compiled/cli` is also running with the same version: `npx @compiled/cli@x.x.x --preset codemods`
  - Use `npx @compiled/cli --preset codemods` if `@compiled/react` is bumped up to the latest version.
