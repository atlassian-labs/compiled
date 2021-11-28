import { styled } from '@compiled/react';

const Button = styled.button`
  color: blue;
  font-size: 30px;
  border: 2px solid blue;
  padding: 8px;
`;

export default function BabelComponent({ children }) {
  return (
    <div css={{ marginTop: 30 }}>
      <Button>{children}</Button>
    </div>
  );
}
