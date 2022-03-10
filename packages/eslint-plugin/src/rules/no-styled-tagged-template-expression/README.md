# `no-styled-tagged-template-expression`

Disallows any `styled` tagged template expressions that originate from `@compiled/react`.

Tagged template expressions are difficult to parse correctly (which can lead to more frequent build failures or invalid CSS generation), have limited type safety, and lack syntax highlighting. These problems can be avoided by using the preferred call expression syntax instead.

---

The `--fix` option on the command line automatically fixes problems reported by this rule.

## Rule details

👎 Examples of **incorrect** code for this rule:

```js
import { styled } from '@compiled/react';

const InlinedStyles = styled.div`
  color: blue;
`;

const MultilineStyles = styled.div`
  color: blue;
  font-weight: 500;
`;

const ComposedStyles = styled(InlinedStyles)`
  font-weight: 500;
`;

const DynamicStyles = styled.div`
  color: ${(props) => props.color};
  ${(props) => (props.disabled ? 'opacity: 0.8' : 'opacity: 1')}
`;
```

👍 Examples of **correct** code for this rule:

```js
import { styled } from '@compiled/react';

const InlinedStyles = styled.div({
  color: 'blue',
});

const MultilineStyles = styled.div({
  color: 'blue',
  fontWeight: 500,
});

const ComposedStyles = styled(InlinedStyles)({
  fontWeight: 500,
});

const DynamicStyles = styled.div(
  {
    color: (props) => props.color,
  },
  (props) => (props.disabled ? 'opacity: 0.8' : 'opacity: 1')
);
```

## Limitations

- Comments are not fixable
