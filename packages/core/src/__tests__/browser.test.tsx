import React from 'react';
import { render } from '@testing-library/react';
import { styled } from '@compiled/core';

describe('browser', () => {
  it('should not render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const { getByText } = render(<StyledDiv>hello world</StyledDiv>);

    expect(getByText('hello world').outerHTML).toMatchInlineSnapshot(
      `"<div class=\\"cc-1610nsm\\">hello world</div>"`
    );
  });

  it('should only render one style block to the head if its already been moved', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    render(
      <>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </>
    );

    expect(document.head.innerHTML).toMatchInlineSnapshot(
      `"<style>.cc-1610nsm{font-size:12px}</style>"`
    );
  });
});
