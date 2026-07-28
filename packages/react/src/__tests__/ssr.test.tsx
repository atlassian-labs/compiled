/**
 * @jest-environment node
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CC as CompiledRoot } from '@compiled/react/runtime';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

describe('SSR', () => {
  it('should render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const result = renderToStaticMarkup(<StyledDiv>hello world</StyledDiv>);

    expect(result).toMatchInlineSnapshot(
      `"<style data-cmpld="true" nonce="k0Mp1lEd">._4ya3eErjyG{font-size:12px}</style><div class="_4ya3eErjyG">hello world</div>"`
    );
  });

  it('should not render undefined into the output HTML when the interpolation is undefined', () => {
    const Interpolation = styled.div<{ fontSize?: number }>`
      font-size: ${(props) => props.fontSize}px;
    `;

    const result = renderToStaticMarkup(<Interpolation>hello world</Interpolation>);

    expect(result).not.toContain('undefined');
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
      `"<style data-cmpld="true" nonce="k0Mp1lEd">._4ya3eErjyG{font-size:12px}</style><div class="_4ya3eErjyG">hello world</div><div class="_4ya3eErjyG">hello world</div>"`
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
      `"<div><div><div><style data-cmpld="true" nonce="k0Mp1lEd">._4ya3eErjyG{font-size:12px}</style><div class="_4ya3eErjyG">hello world</div></div></div><div class="_4ya3eErjyG">hello world</div></div>"`
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
      `"<style data-cmpld="true" nonce="k0Mp1lEd">._3iDTPbQ4SZ{display:flex}</style><div class="_3iDTPbQ4SZ"><style data-cmpld="true" nonce="k0Mp1lEd">._4ya3eErjyG{font-size:12px}</style><div class="_4ya3eErjyG">hello world</div><div class="_4ya3eErjyG">hello world</div></div>"`
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
      "<style data-cmpld="true" nonce="k0Mp1lEd">._3iDTPbQ4SZ{display:flex}._4ya3eEHMkp{font-size:50px}._1UtDYz5CUP{color:purple}._2ipzJpGowl:link{color:red}._2nTuUYy8mA:visited{color:pink}._10n1R5Jwxv:focus{color:green}._0clgaMFQV5:hover{color:yellow}._0CMRbkynoA:active{color:blue}@media (max-width:800px){._3YxZqqFQV5:focus{color:yellow}._3cQMScbqW0:active{color:black}}@supports (display:grid){._3geGi3FQV5:focus{color:yellow}._0vra6NbqW0:active{color:black}}</style>
      <a href="https://atlassian.design" class="_3iDTPbQ4SZ _4ya3eEHMkp _1UtDYz5CUP _2ipzJpGowl _2nTuUYy8mA _10n1R5Jwxv _0clgaMFQV5 _0CMRbkynoA _3YxZqqFQV5 _3cQMScbqW0 _3geGi3FQV5 _0vra6NbqW0">Atlassian Design System</a>"
    `);
  });

  it('should not render escaped HTML characters in style tags', () => {
    const Interpolation = styled.div`
      & > span {
        color: blue;
      }
    `;

    const result = renderToStaticMarkup(
      <Interpolation>
        <span>hello world</span>
      </Interpolation>
    );

    expect(result).toMatchInlineSnapshot(
      `"<style data-cmpld="true" nonce="k0Mp1lEd">._3QqDuIynoA>span{color:blue}</style><div class="_3QqDuIynoA"><span>hello world</span></div>"`
    );
  });
});
