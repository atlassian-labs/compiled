# `local-cx-xcss`

This rule ensures the `cx()` function is only used within the `xcss` prop. This aids tracking what styles are applied to a jsx element.

👎 Examples of **incorrect** code for this rule:

```js
import { cx, cssMap } from '@compiled/react';

const styles = cssMap({
  text: { color: 'red' },
  bg: { background: 'blue' },
});

const joinedStyles = cx(styles.text, styles.bg);

<Button xcss={joinedStyles} />;
```

👍 Examples of **correct** code for this rule:

```js
import { cx, cssMap } from '@compiled/react';

const styles = cssMap({
  text: { color: 'red' },
  bg: { background: 'blue' },
});

<Button xcss={cx(styles.text, styles.bg)} />;
```
