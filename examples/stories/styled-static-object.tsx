import { styled } from '@compiled/react';

export default {
  title: 'styled/static object',
};

const Thing = styled.div({
  fontSize: '20px',
  color: 'red',
});

const Box = styled.div({ fontSize: 20 }, `color: blue;`, [{ padding: 20 }], {
  backgroundColor: 'red',
});

export const ObjectLiteral = (): JSX.Element => <Thing>hello world</Thing>;

export const StyledArgs = (): JSX.Element => <Box>HELLO WORLD</Box>;
