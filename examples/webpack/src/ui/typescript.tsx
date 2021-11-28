import { styled } from '@compiled/react';

import { primary } from '../common/constants';

const HelloWorld = styled.div`
  color: ${primary};
  font-weight: 500;

  :hover {
    color: red;
  }

  :focus {
    color: blue;
  }
`;

const MediaComponent = styled.div`
  border: 10px dotted purple;
  :before {
    content: 'small screen';
  }

  @media (min-width: 500px) {
    border: 2px solid red;

    :before {
      content: 'large screen';
    }
  }
`;

export const TypeScript = (props: { children: string }): JSX.Element => (
  <HelloWorld tabIndex={0}>
    {props.children}
    <MediaComponent />

    <div
      css={{
        span: {
          color: '#ccc',
          ':hover': {
            color: 'red',
          },
        },
      }}>
      <span>nested span</span>
    </div>
  </HelloWorld>
);
