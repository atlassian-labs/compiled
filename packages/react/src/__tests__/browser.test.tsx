// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
import { render } from '@testing-library/react';
import React from 'react';

jest.mock('../runtime/is-server-environment', () => ({
  isServerEnvironment: () => false,
}));

describe('browser', () => {
  beforeEach(() => {
    // Reset style tags in head before each test so that it will remove styles
    // injected by test
    document.head.querySelectorAll('style').forEach((styleElement) => {
      styleElement.textContent = '';
    });
  });

  it('should not render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const { baseElement } = render(<StyledDiv>hello world</StyledDiv>);

    expect(baseElement.innerHTML).toMatchInlineSnapshot(
      `"<div><div class="_1wyb1fwx">hello world</div></div>"`
    );
  });

  it('should only render one style block to the head if its already been moved', () => {
    const StyledDiv = styled.div`
      font-size: 14px;
    `;

    render(
      <>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </>
    );

    expect(document.head.innerHTML).toMatchInlineSnapshot(
      `"<style nonce="k0Mp1lEd">._1wybdlk8{font-size:14px}</style>"`
    );
  });

  it('should render style tags in buckets', () => {
    const StyledLink = styled.a`
      display: flex;
      font-size: 50px;
      color: purple;
      :hover {
        color: yellow;
      }
      :active {
        color: blue;
      }
      :link {
        color: red;
      }
      @supports (display: grid) {
        :active {
          color: black;
        }
        :focus {
          color: yellow;
        }
      }
      :focus {
        color: green;
      }
      :link,
      :focus-visible {
        color: white;
      }
      :visited {
        color: pink;
      }
      @media (max-width: 800px) {
        :active {
          color: black;
        }
        :focus {
          color: yellow;
        }
        :hover,
        :focus-visible {
          color: grey;
        }
      }
    `;

    render(<StyledLink href="https://atlassian.design">Atlassian Design System</StyledLink>);

    expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style nonce="k0Mp1lEd">._1e0c1txw{display:flex}._1wyb12am{font-size:50px}._syaz1cnh{color:purple}._v0vw1x77:focus-visible, ._ysv71x77:link{color:white}</style>
      <style nonce="k0Mp1lEd">._ysv75scu:link{color:red}</style>
      <style nonce="k0Mp1lEd">._105332ev:visited{color:pink}</style>
      <style nonce="k0Mp1lEd">._f8pjbf54:focus{color:green}</style>
      <style nonce="k0Mp1lEd">._30l31gy6:hover{color:yellow}</style>
      <style nonce="k0Mp1lEd">._9h8h13q2:active{color:blue}</style>
      <style nonce="k0Mp1lEd">@supports (display:grid){._1df61gy6:focus{color:yellow}._7okp11x8:active{color:black}}@media (max-width:800px){._1o8z1gy6:focus{color:yellow}._jbabtwqo:focus-visible, ._6146twqo:hover{color:grey}._1cld11x8:active{color:black}}</style>
      "
    `);
  });
});
