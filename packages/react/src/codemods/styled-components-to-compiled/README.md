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

When a new version of `@compiled/react` is released, Please update `@compiled/react` and `@compiled/cli` to the same new version simultaneously.
