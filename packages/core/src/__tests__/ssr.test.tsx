/**
 * @jest-environment node
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { styled, CC } from '@compiled/core';

xdescribe('SSR', () => {
  it('should render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(<StyledDiv>hello world</StyledDiv>);

    expect(result).toMatchInlineSnapshot(
      `"<style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px}</style><div class=\\"cc-1610nsm\\">hello world</div>"`
    );
  });

  it('should only render one style block when wrapped in a compiled component when siblings', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <CC>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </CC>
    );

    expect(result).toMatchInlineSnapshot(
      `"<style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px}</style><div class=\\"cc-1610nsm\\">hello world</div><div class=\\"cc-1610nsm\\">hello world</div>"`
    );
  });

  it('should render semantically higher in the tree so FOUC does not occur when wrapped in compiled component', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <CC>
        <div>
          <div>
            <div>
              <StyledDiv>hello world</StyledDiv>
            </div>
          </div>

          <StyledDiv>hello world</StyledDiv>
        </div>
      </CC>
    );

    expect(result).toMatchInlineSnapshot(
      `"<div><div><div><style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px}</style><div class=\\"cc-1610nsm\\">hello world</div></div></div><div class=\\"cc-1610nsm\\">hello world</div></div>"`
    );
  });

  it('should only render one style element when having a parent compiled component', () => {
    const StyledParent = styled.div`
      display: flex;
    `;
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <StyledParent>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </StyledParent>
    );

    expect(result).toMatchInlineSnapshot(
      `"<style nonce=\\"k0Mp1lEd\\">.cc-10mivee{display:flex}</style><div class=\\"cc-10mivee\\"><style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px}</style><div class=\\"cc-1610nsm\\">hello world</div><div class=\\"cc-1610nsm\\">hello world</div></div>"`
    );
  });
});
