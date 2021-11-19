import { styled } from '@compiled/react';
import { colors, objectStyles } from 'module-a';

import { hoverObjectLiteral } from '../mixins/mixins';

export default {
  title: 'ast/module traversal',
};

const { backgroundColor: borderColor } = objectStyles;

const Thing = styled.div<{ bg: 'blue' }>({
  fontSize: '20px',
  color: colors.primary,
  ':hover': hoverObjectLiteral,
  backgroundColor: (props) => props.bg,
  border: `5px dashed ${borderColor()}`,
});

export const Example = (): JSX.Element => <Thing bg="blue">hello world</Thing>;
