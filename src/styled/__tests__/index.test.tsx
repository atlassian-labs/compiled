import { render } from '@testing-library/react';
import React from 'react';
import { styled } from '@compiled/css-in-js';

describe('styled component', () => {
  it('should render a simple styled div using an object', () => {
    const StyledDiv = styled.div({
      fontSize: '12px',
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should render a simple styled div using a template literal', () => {
    const StyledDiv = styled.div`
      font-size: 30px;
    `;

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '30px');
  });
});
