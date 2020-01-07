import { render } from '@testing-library/react';
import React from 'react';
import { styled } from '@compiled/css-in-js';

describe('styled component', () => {
  it('should render a simple styled div', () => {
    const StyledDiv = styled.div({
      fontSize: '12px',
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCssRule('font-size', '12px');
  });
});
