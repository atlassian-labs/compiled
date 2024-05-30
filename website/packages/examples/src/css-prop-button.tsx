/** @jsxImportSource @compiled/react */

import { css } from '@compiled/react';

const buttonStyles = css({
  border: 'none',
  borderRadius: '3px',
  padding: '8px 10px',
  backgroundColor: '#6554C0',
  color: '#fff',
  fontWeight: 400,
  fontFamily: 'Arial',
  fontSize: '14px',

  '&:hover': {
    backgroundColor: '#8777D9',
  },

  '&:active': {
    backgroundColor: '#5243AA',
  },
});

export const Button = ({ children }) => {
  return (
    <button
      type="button"
      css={buttonStyles}>
      {children}
    </button>
  );
};
