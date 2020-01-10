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

  it('should interpolate a simple number value', () => {
    const size = '12px';
    const StyledDiv = styled.div<{ fontSize: string }>`
      font-size: ${props => props.fontSize};
    `;

    const { getByText } = render(<StyledDiv fontSize={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '12px');
  });

  it('should not pass down invalid html attributes to the node', () => {
    const size = '12px';
    const StyledDiv = styled.div<{ fonty: string }>`
      font-size: ${props => props.fonty};
    `;

    const { getByText, debug } = render(<StyledDiv fonty={size}>hello world</StyledDiv>);

    expect(getByText('hello world').getAttribute('fonty')).toBe(null);
  });
});
