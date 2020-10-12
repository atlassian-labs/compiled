import React from 'react';
import { render } from '@testing-library/react';
import { styled } from '@compiled/core';

jest.mock('../../../runtime/dist/is-node', () => ({
  isNodeEnvironment: () => false,
}));

describe('browser', () => {
  it('should not render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const { baseElement } = render(<StyledDiv>hello world</StyledDiv>);

    expect(baseElement.innerHTML).toMatchInlineSnapshot(
      `"<div><div class=\\"_36l61fwx\\">hello world</div></div>"`
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
      `"<style nonce=\\"k0Mp1lEd\\">._36l61fwx{font-size:12px}</style>"`
    );
  });
});
