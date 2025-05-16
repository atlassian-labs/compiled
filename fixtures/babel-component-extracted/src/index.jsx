import { styled, css } from '@compiled/react';

const Button = styled.button({
  color: 'blue',
  fontSize: '30px',
  border: '2px solid transparent',
  padding: '32px',
  backgroundColor: 'yellow',

  '&:hover': {
    borderColor: 'blue',
    backgroundColor: 'blue',
    color: 'white',
  },

  '&:hover, &:focus': {
    backgroundColor: 'blue',
    color: 'white',
  },
});

export default function BabelComponent({ children }) {
  return (
    <div css={css({ marginTop: 30 })}>
      <Button>{children}</Button>
    </div>
  );
}
