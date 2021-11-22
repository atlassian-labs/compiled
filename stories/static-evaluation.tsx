import { styled } from '@compiled/react';

export default {
  title: 'ast/static evaluation',
};

const fontSize = 12;
const colors = {
  primary: 'blue',
  danger: 'red',
};

const Block = styled.div`
  font-size: ${fontSize * 2}px;
  color: ${colors.primary};
`;

export const Styled = (): JSX.Element => <Block>hello primary</Block>;

export const CssProp = (): JSX.Element => (
  <div css={{ fontSize: fontSize * 3, color: colors.danger }}>hello danger</div>
);
