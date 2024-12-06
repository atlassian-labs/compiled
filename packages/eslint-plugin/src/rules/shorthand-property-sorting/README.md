# `shorthand-property-sorting`

Enforces CSS property sorting for packages `css`, `cssMap`, `styled` that originates from `@compiled/react`, and `@atlaskit/css`.

This rule enforces that the order in which the properties appear in a component's source code matches the actual ordering the properties will have at build time and runtime.

## Context

CSS has "shorthand properties", like `font` and `border`, that are useful shorthands for other, more verbose properties. For example, `font` is a shorthan property for `fontSize`, `fontWeight`, `lineHeight` (surprisingly enough!), and so on.

When you mix shorthand properties and non-shorthand properties, Compiled sorts these CSS properties in a specific way. If you write your styles in a way that doesn't match the way that Compiled sorts them at build-time and runtime, this ESLint rule will alert you.

Let's take some examples.

The following example implies the `paddingTop` will be overridden by `padding`. However, Compiled will actually sort the `padding` so that it gets overridden by `paddingTop` instead.

```tsx
import { css } from '@compiled/react';

const styles = css({
  // ESLint violation: padding should come before paddingTop
  paddingTop: token('space.050'),
  padding: token('space.100'),
});

const Component = ({ children }) => {
  return <div css={styles}>{children}</div>;
};
```

And in the following example, the code implies that `borderColor` will be overridden by `borderTop`, because `borderTop` actually implicitly sets `borderColor` to `initial`. Compiled doesn't do this -- `borderTop` will come before `borderColor` instead.

```tsx
import { css } from '@compiled/react';

const styles = css({
  // ESLint violation: borderTop should come before borderColor
  borderColor: 'blue',
  borderTop: '1px solid',
});

const Component = ({ children }) => {
  return <div css={styles}>{children}</div>;
};
```

Note that if you are using style composition (applying several `css` calls or `cssMap` objects to a component), the ordering of CSS properties is applied across the `css` and `cssMap` function call.

For example, the following code will cause an ESLint violation. This is because in `Component`, `paddingTop` is being applied before `padding`, which is the incorrect order.

```tsx
import { css, cssMap } from '@compiled/react';

const styles = cssMap({
  root: {
    paddingTop: '5px',
  },
  warning: {
    // ...
  },
});

const extraPadding = css({
  padding: '5px',
});

const Component = ({ children }) => {
  return <div css={[styles.root, extraPadding]}>{children}</div>;
};
```

## How do I fix this?

### \[Recommended\] Expand the shorthand property

Whenever possible, you should **expand the shorthand property**. For example:

```tsx
const styles = css({
  paddingTop: token('space.050'),
  padding: token('space.100'),
});
```

can be re-written as

```tsx
const styles = css({
  paddingTop: token('space.050'),
  paddingLeft: token('space.100'),
  paddingRight: token('space.100'),
  paddingBottom: token('space.100'),
});
```

If you're not sure what to expand the shorthand property to, you can refer to [resources like MDN](https://developer.mozilla.org/en-US/). For example, for `padding`, we see that [`padding` can be expanded to `paddingTop`, `paddingLeft`, `paddingRight`, and `paddingBottom`](https://developer.mozilla.org/en-US/docs/Web/CSS/padding).

### Re-order the properties

Sometimes this is not possible (e.g. if you are using an Atlassian Design System `font` token). If this is the case, you should re-order the shorthand and non-shorthand properties so that they are in the right order. The ESLint error message will tell you which properties are in the wrong order. For example:

```tsx
import { css } from '@compiled/react';
const styles = css({
  lineHeight: '...',
  font: '...',
  fontWeight: '',
});
export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
```

can be changed to

```tsx
import { css } from '@compiled/react';
const styles = css({
  font: '...',
  fontWeight: '',
  lineHeight: '...',
});
export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
```

## Examples

👎 Examples of **incorrect** code for this rule:

```js
import { css } from '@compiled/react';

const styles = css({
  borderColor: 'red',
  border: '1px solid black',
});
```

👍 Examples of **correct** code for this rule:

```js
import { css } from '@compiled/react';

const styles = css({
  border: '1px solid black',
  borderColor: 'red',
});
```

## Found a bug?

- Atlassian employees: please contact us through the `#help-compiled` channel on Slack.
- Non-Atlassian employees should contact us [through the Issues page](https://github.com/atlassian-labs/compiled/issues).
