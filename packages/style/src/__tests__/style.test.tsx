import React from 'react';
import Style from '../style';
import { render } from '@testing-library/react';

describe('<Style />', () => {
  it('should render nothing on the client', () => {
    const { queryByTestId } = render(
      <Style hash="a" testId="style">{`.a { display: block; }`}</Style>
    );

    expect(queryByTestId('style')).toBeNull();
  });

  it('should add style to the head on the client', () => {
    render(<Style hash="b" testId="style">{`.b { display: block; }`}</Style>);

    expect(document.head.innerHTML).toInclude(
      '<style data-compiled="compiled">.b { display: block; }</style>'
    );
  });

  it('should only add one style if it was already added', () => {
    render(<Style hash="c" testId="style">{`.c { display: block; }`}</Style>);
    render(<Style hash="c" testId="style">{`.c { display: block; }`}</Style>);

    expect(document.head.innerHTML).toIncludeRepeated(
      '<style data-compiled="compiled">.c { display: block; }</style>',
      1
    );
  });
});
