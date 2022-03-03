import { styled } from '@compiled/react';

export default {
  title: 'ast/static evaluation',
};

const fontSize = 12;
const colors = {
  danger: 'red',
  primary: 'blue',
};

const Block = styled.div`
  font-size: ${fontSize * 2}px;
  color: ${colors.primary};
`;

export const Styled = (): JSX.Element => <Block>hello primary</Block>;

export const CssProp = (): JSX.Element => (
  <div css={{ color: colors.danger, fontSize: fontSize * 3 }}>hello danger</div>
);
