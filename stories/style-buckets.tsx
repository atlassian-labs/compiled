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
          display: 'flex',
          fontSize: '50px',
          color: 'purple',
          ':hover': hoverObjectLiteral,
          ':active': {
            color: 'blue',
          },
          ':link': {
            color: 'red',
          },
          ':focus': {
            color: 'green',
          },
          ':visited': {
            color: 'pink',
          },
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
