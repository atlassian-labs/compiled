# `local-cx-xcss`

This rule ensures the `cx()` function is only used within the `xcss` prop. This aids tracking what styles are applied to a jsx element.

👎 Examples of **incorrect** code for this rule:

```js
import { cx, styleMap } from '@compiled/react';

const styles = styleMap({
  text: { color: 'red' },
  bg: { background: 'blue' },
});

const joinedStyles = cx(styles.text, styles.bg);

<Button xcss={styles} />;
```

👍 Examples of **correct** code for this rule:

```js
import { cx, styleMap } from '@compiled/react';

const styles = styleMap({ text: { color: 'red' } });

<Button xcss={cx(styles.text, styles.bg)} />;
```
