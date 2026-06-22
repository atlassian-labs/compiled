// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
import { render } from '@testing-library/react';
import React from 'react';

import Style from '../runtime/style';

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
      "<style nonce="k0Mp1lEd">._1e0c1txw{display:flex}._1wyb12am{font-size:50px}._syaz1cnh{color:purple}</style>
      <style nonce="k0Mp1lEd">._ysv75scu:link{color:red}._ysv71x77:link{color:white}</style>
      <style nonce="k0Mp1lEd">._105332ev:visited{color:pink}</style>
      <style nonce="k0Mp1lEd">._f8pjbf54:focus{color:green}</style>
      <style nonce="k0Mp1lEd">._v0vw1x77:focus-visible{color:white}</style>
      <style nonce="k0Mp1lEd">._30l31gy6:hover{color:yellow}</style>
      <style nonce="k0Mp1lEd">._9h8h13q2:active{color:blue}</style>
      <style nonce="k0Mp1lEd">@media (max-width:800px){._1o8z1gy6:focus{color:yellow}._jbabtwqo:focus-visible{color:grey}._6146twqo:hover{color:grey}._1cld11x8:active{color:black}}@supports (display:grid){._1df61gy6:focus{color:yellow}._7okp11x8:active{color:black}}</style>
      "
    `);
  });

  it('should inject at-rule-wrapped non-atomic rules into the catch-all bucket, not an at-rule bucket', () => {
    // cc-zzzzzz sorts AFTER cc-aaaaaa lexically, but must appear FIRST (source order)
    const baseMediaRule = '@media (min-width:1px){.cc-zzzzzz .panel{background:gray}}';
    const overrideMediaRule = '@media (min-width:1px){.cc-aaaaaa .panel{background:pink}}';
    const atomicMediaRule = '@media (min-width:1px){._bbbbbbbb{color:blue}}';

    // Two <Style> components — one per cssMapScoped variant, like real usage
    render(
      <>
        <Style>{[baseMediaRule]}</Style>
        <Style>{[overrideMediaRule, atomicMediaRule]}</Style>
      </>
    );

    // Non-atomic @media rules go to catch-all bucket in source order (cc-zzzzzz before cc-aaaaaa),
    // atomic @media rule goes to a separate at-rule bucket.
    const styleTexts = Array.from(document.head.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .filter((t) => t.length > 0);
    expect(styleTexts).toMatchInlineSnapshot(`
      [
        "@media (min-width:1px){.cc-zzzzzz .panel{background:gray}}@media (min-width:1px){.cc-aaaaaa .panel{background:pink}}",
        "@media (min-width:1px){._bbbbbbbb{color:blue}}",
      ]
    `);
  });
});
