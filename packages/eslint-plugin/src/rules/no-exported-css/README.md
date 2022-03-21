# `no-exported-css`

Disallows `css` export declarations that originate from `@compiled/react`

Exporting css declarations may result in unexpected errors when imported, because its value will be `null` at runtime. Additionally, co-locating css definitions with their usage is considered best practice in order to improve code readability and build performance.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { css } from '@compiled/react';

export const styles = css({});

export default css({});
```

👍 Examples of **correct** code for this rule:

```js
import { css } from '@compiled/react';

const styles = css({});
```
