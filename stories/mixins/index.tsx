import { css } from '@compiled/react';

export const hoverObjectLiteral = {
  backgroundColor: 'red',
  color: 'purple',
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
  color: 'purple',
  fontSize: '32px',
  fontWeight: 'bold',
  textDecoration: 'underline',
});
