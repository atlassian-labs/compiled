import '@compiled/react';

import { hoverObjectLiteral } from './mixins';

export default {
  title: 'atomic/style buckets',
};

export const Example = (): JSX.Element => {
  return (
    <a
      href="https://atlassian.design"
      css={[
        {
          ':active': {
            color: 'blue',
          },
          ':focus': {
            color: 'green',
          },
          ':hover': hoverObjectLiteral,
          ':link': {
            color: 'red',
          },
          ':visited': {
            color: 'pink',
          },
          color: 'purple',
          display: 'flex',
          fontSize: '50px',
        },
        `
        @media (max-width: 800px) {
          :active { color: black; }
          :focus { color: yellow; }
        }
      `,
      ]}>
      Atlassian Design System
    </a>
  );
};
