import { colors, objectStyles } from '@compiled-private/module-a';
import { styled } from '@compiled/react';

import { hoverObjectLiteral } from './mixins';

export default {
  title: 'ast/module traversal',
};

const { backgroundColor: borderColor } = objectStyles;

const Thing = styled.div<{ bg: 'blue' }>({
  ':hover': hoverObjectLiteral,
  backgroundColor: (props) => props.bg,
  border: `5px dashed ${borderColor()}`,
  color: colors.primary,
  fontSize: '20px',
});

export const Example = (): JSX.Element => <Thing bg="blue">hello world</Thing>;
