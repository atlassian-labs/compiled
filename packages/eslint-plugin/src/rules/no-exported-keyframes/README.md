# `no-exported-keyframes`

Disallows `keyframes` export declarations that originate from `@compiled/react`

Exporting keyframes declarations may result in unexpected errors when imported, because its value will be `null` at runtime. Additionally, co-locating keyframes definitions with their usage is considered best practice in order to improve code readability and build performance.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { keyframes } from '@compiled/react';

export const animation = keyframes({});

export default keyframes({});
```

👍 Examples of **correct** code for this rule:

```js
import { keyframes } from '@compiled/react';

const animation = keyframes({});
```
