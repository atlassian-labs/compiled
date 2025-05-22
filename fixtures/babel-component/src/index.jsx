import { styled } from '@compiled/react';

const Button = styled.button`
  color: blue;
  font-size: 30px;
  border: 2px solid transparent;
  padding: 32px;

  &:hover {
    border-color: blue;
    background-color: blue;
    color: white;
  }

  &:hover,
  &:focus {
    background-color: blue;
    color: white;
  }
`;

export default function BabelComponent({ children }) {
  return (
    <div css={{ marginTop: 30 }}>
      <Button>{children}</Button>
    </div>
  );
}
