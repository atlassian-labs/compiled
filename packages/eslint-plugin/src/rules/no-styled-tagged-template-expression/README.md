# `no-styled-tagged-template-expression`

Disallows tagged template expressions used with `styled` from `@compiled/react`.

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
