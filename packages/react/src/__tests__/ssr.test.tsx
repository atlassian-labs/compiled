/**
 * @jest-environment node
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { styled } from '@compiled/react';
import { CC as CompiledRoot } from '@compiled/react/runtime';

describe('SSR', () => {
  it('should render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(<StyledDiv>hello world</StyledDiv>);

    expect(result).toMatchInlineSnapshot(
      `"<style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1wyb1fwx{font-size:12px}</style><div class=\\"_1wyb1fwx\\">hello world</div>"`
    );
  });

  it('should only render one style block when wrapped in a compiled component when siblings', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <CompiledRoot>
        <StyledDiv>hello world</StyledDiv>
        <StyledDiv>hello world</StyledDiv>
      </CompiledRoot>
    );

    expect(result).toMatchInlineSnapshot(
      `"<style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1wyb1fwx{font-size:12px}</style><div class=\\"_1wyb1fwx\\">hello world</div><div class=\\"_1wyb1fwx\\">hello world</div>"`
    );
  });

  it('should render semantically higher in the tree so FOUC does not occur when wrapped in compiled component', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(
      <CompiledRoot>
        <div>
          <div>
            <div>
              <StyledDiv>hello world</StyledDiv>
            </div>
          </div>

          <StyledDiv>hello world</StyledDiv>
        </div>
      </CompiledRoot>
    );

    expect(result).toMatchInlineSnapshot(
      `"<div><div><div><style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1wyb1fwx{font-size:12px}</style><div class=\\"_1wyb1fwx\\">hello world</div></div></div><div class=\\"_1wyb1fwx\\">hello world</div></div>"`
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
      `"<style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1e0c1txw{display:flex}</style><div class=\\"_1e0c1txw\\"><style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1wyb1fwx{font-size:12px}</style><div class=\\"_1wyb1fwx\\">hello world</div><div class=\\"_1wyb1fwx\\">hello world</div></div>"`
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
      }
    `;

    const result = renderToStaticMarkup(
      <StyledLink href="https://atlassian.design">Atlassian Design System</StyledLink>
    );

    expect(result.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style data-cmpld=\\"true\\" nonce=\\"k0Mp1lEd\\">._1e0c1txw{display:flex}._1wyb12am{font-size:50px}._syaz1cnh{color:purple}._ysv75scu:link{color:red}._105332ev:visited{color:pink}._f8pjbf54:focus{color:green}._30l31gy6:hover{color:yellow}._9h8h13q2:active{color:blue}@supports (display: grid){._qxnw1gy6:focus{color:yellow}._p7tw11x8:active{color:black}}@media (max-width: 800px){._vyxz1gy6:focus{color:yellow}._ojvu11x8:active{color:black}}</style>
      <a href=\\"https://atlassian.design\\" class=\\"_1e0c1txw _1wyb12am _syaz1cnh _30l31gy6 _9h8h13q2 _ysv75scu _p7tw11x8 _qxnw1gy6 _f8pjbf54 _105332ev _ojvu11x8 _vyxz1gy6\\">Atlassian Design System</a>"
    `);
  });
});
