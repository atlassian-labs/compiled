import { styled } from '@compiled/react';
import { colors, objectStyles } from 'module-a';
import { hover } from './mixins/mixins';

export default {
  title: 'ast/module traversal',
};

const { backgroundColor: borderColor } = objectStyles;

const Thing = styled.div<{ bg: 'blue' }>({
  fontSize: '20px',
  color: colors.primary,
  ':hover': hover,
  backgroundColor: (props) => props.bg,
  border: `5px dashed ${borderColor()}`,
});

export const Example = () => <Thing bg="blue">hello world</Thing>;
