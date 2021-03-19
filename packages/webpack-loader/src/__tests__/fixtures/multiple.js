import { styled } from '@compiled/react';
import { blueviolet, blue, orange, purple, red, yellow } from './imports/colors';
// ↓↓↓ This should not have their styles extracted ↓↓↓
import { Orange } from './imports/css-prop';

export const Blue = styled.span`
  color: ${blueviolet};

  :focus {
    color: ${purple};
  }

  :hover {
    color: ${blue};
  }
`;

export const Red = styled.span`
  color: ${red};

  :focus {
    color: ${orange};
  }

  :hover {
    color: ${yellow};
  }
`;
