import { css } from '@compiled/react';

export const hoverObjectLiteral = {
  color: 'purple',
  backgroundColor: 'red',
};

export const primaryTaggedTemplateExpression = css`
  font-size: 32px;
  font-weight: bold;
  color: purple;
  text-decoration: underline;
`;

export const secondaryTaggedTemplateExpression = css`
  border: 1px solid red;
`;

export const primaryCallExpression = css({
  fontSize: '32px',
  fontWeight: 'bold',
  color: 'purple',
  textDecoration: 'underline',
});
