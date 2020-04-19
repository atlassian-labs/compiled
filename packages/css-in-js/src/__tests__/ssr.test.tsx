/**
 * @jest-environment node
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'jest-extended';
import { styled } from '@compiled/css-in-js';

describe('<Style />', () => {
  it('should render styles on the server', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(<StyledDiv>hello world</StyledDiv>);

    expect(result).toMatchInlineSnapshot(
      `"<style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px;}</style><div class=\\"cc-1610nsm\\">hello world</div>"`
    );
  });

  it('should only render one style block for duplicate usages', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </>
    );

    expect(result).toMatchInlineSnapshot(
      `"<style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px;}</style><div class=\\"cc-1610nsm\\">hello world</div><div class=\\"cc-1610nsm\\">hello world</div>"`
    );
  });

  it('should render semantically higher in the tree so FOUC does not occur', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <div>
        <div>
          <div>
            <StyledDiv>hello world</StyledDiv>
          </div>
        </div>

        <StyledDiv>hello world</StyledDiv>
      </div>
    );

    expect(result).toMatchInlineSnapshot(
      `"<div><div><div><style nonce=\\"k0Mp1lEd\\">.cc-1610nsm{font-size:12px;}</style><div class=\\"cc-1610nsm\\">hello world</div></div></div><div class=\\"cc-1610nsm\\">hello world</div></div>"`
    );
  });
});
