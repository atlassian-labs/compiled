import { css, styled } from '@compiled/react';
import React from 'react';

import { blue, blueviolet, orange, purple, red, yellow } from './common/colors';
// @ts-expect-error ↓↓↓ This should not have their styles extracted ↓↓↓
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Coral } from './common/css-prop';

export const Styled = styled.span`
  color: ${blueviolet};

  :focus {
    color: ${purple};
  }

  :hover {
    color: ${blue};
  }
`;

const styles = css`
  color: ${red};

  :focus {
    color: ${orange};
  }

  :hover {
    color: ${yellow};
  }
`;

export const App = (): JSX.Element => (
  <>
    <div css={styles} />
    <Styled />
  </>
);
