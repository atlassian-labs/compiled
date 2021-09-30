// @flow strict-local

import React from 'react';
import { css, ClassNames, styled, keyframes } from '@compiled/react';

// CSS types
(): React$Element<'div'> => {
  const styles = css`
    display: flex;
    font-size: 30px;
    color: red;
  `;
  return <div css={styles}>red text</div>;
};

// Classname types
(): React$Element<typeof ClassNames> => (
  <ClassNames>
    {({ css }) => {
      const styles = css({
        display: 'flex',
        fontSize: '30px',
        color: 'red',
        fdsf: 'hello',
      });

      return <div className={styles}>red text</div>;
    }}
  </ClassNames>
);

// Styled types
const StyledTaggedTemplateExpression: React$ComponentType<any> = styled.div`
  display: flex;
  font-size: 30px;
  color: red; ;
`;
(): React$Element<typeof StyledTaggedTemplateExpression> => (
  <StyledTaggedTemplateExpression>red text</StyledTaggedTemplateExpression>
);

// Keyframe types
const fadeOut = keyframes({
  from: {
    opacity: 1,
  },
  to: {
    opacity: 0,
  },
});
<div
  css={`
    animation: ${fadeOut} 2s ease-in-out infinite;
  `}>
  blue to indigo
</div>;
