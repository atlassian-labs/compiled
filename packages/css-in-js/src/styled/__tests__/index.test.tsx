import { render } from '@testing-library/react';
import React from 'react';
import { styled } from '@compiled/css-in-js';
import { em } from 'polished';

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

  it('should at runtime use a call expression inline', () => {
    const size = 12;
    const StyledDiv = styled.div({
      fontSize: em(size),
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '0.75em');
  });

  it('should at runtime use a identifier referencing a call expression', () => {
    const size = em(12);
    const StyledDiv = styled.div({
      fontSize: size,
    });

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '0.75em');
  });

  it('should not pass down invalid html attributes to the node', () => {
    const size = '12px';
    const StyledDiv = styled.div<{ fonty: string }>`
      font-size: ${props => props.fonty};
    `;

    const { getByText } = render(<StyledDiv fonty={size}>hello world</StyledDiv>);

    expect(getByText('hello world').getAttribute('fonty')).toBe(null);
  });

  it('should automatically add suffix on template literal', () => {
    const size = 12;
    const StyledDiv = styled.div<{ size: number }>`
      height: ${props => props.size}px;
      width: ${props => props.size}px;
    `;

    const { getByText } = render(<StyledDiv size={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss({
      height: '12px',
      width: '12px',
    });
  });

  it('should automatically add suffix on css object', () => {
    const size = 12;
    const StyledDiv = styled.div<{ size: number }>({
      height: props => `${props.size}px`,
      width: props => `${props.size}px`,
    });

    const { getByText } = render(<StyledDiv size={size}>hello world</StyledDiv>);

    expect(getByText('hello world')).toHaveCompiledCss({
      height: '12px',
      width: '12px',
    });
  });

  it('should allow passing down native attributes', () => {
    const Link = styled.a``;

    const { getByText } = render(<Link href="#">hello world</Link>);

    expect(getByText('hello world').getAttribute('href')).toEqual('#');
  });
});
