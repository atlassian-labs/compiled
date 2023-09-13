import { styled, css } from '@compiled/react';

const Button = styled.button`
  color: blue;
  font-size: 30px;
  border: 2px solid blue;
  padding: 32px;
  background-color: yellow;
`;

export default function BabelComponent({ children }) {
  return (
    <div css={css({ marginTop: 30 })}>
      <Button>{children}</Button>
    </div>
  );
}
