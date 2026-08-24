// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';
import { render } from '@testing-library/react';
import React from 'react';

import Style from '../runtime/style';

import { getAllCssText, getStyleCssTexts } from './utils/css-text';

jest.mock('../runtime/is-server-environment', () => ({
  isServerEnvironment: () => false,
}));

describe('browser', () => {
  beforeEach(() => {
    // Reset style tags in head before each test so that it will remove styles
    // injected by test. Clearing `textContent` alone is not enough: it only clears the
    // sheet as a side effect of removing a child text node, and `insertRule` never
    // creates one — so after the first reset there is nothing left to remove and the
    // rules survive. The elements themselves must stay, as the runtime caches its style
    // buckets in a module-level singleton.
    document.head.querySelectorAll('style').forEach((styleElement) => {
      styleElement.textContent = '';

      const { sheet } = styleElement;
      while (sheet && sheet.cssRules.length > 0) {
        sheet.deleteRule(sheet.cssRules.length - 1);
      }
    });
  });

  it('should not render styles inline', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
    `;

    const { baseElement } = render(<StyledDiv>hello world</StyledDiv>);

    expect(baseElement.innerHTML).toMatchInlineSnapshot(
      `"<div><div class="_4ya3eErjyG">hello world</div></div>"`
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

    expect(getAllCssText()).toMatchInlineSnapshot(`"._4ya3eEEbN9 {font-size: 14px;}"`);
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

    expect(getStyleCssTexts()).toMatchInlineSnapshot(`
      [
        "._3iDTPbQ4SZ {display: flex;}._4ya3eEHMkp {font-size: 50px;}._1UtDYz5CUP {color: purple;}",
        "._2ipzJpGowl:link {color: red;}._2ipzJpaJpK:link {color: white;}",
        "._2nTuUYy8mA:visited {color: pink;}",
        "._10n1R5Jwxv:focus {color: green;}",
        "._22XfGnaJpK:focus-visible {color: white;}",
        "._0clgaMFQV5:hover {color: yellow;}",
        "._0CMRbkynoA:active {color: blue;}",
        "@media (max-width:800px) {._3YxZqqFQV5:focus {color: yellow;}._1h21S5okCM:focus-visible {color: grey;}._0oG7IkokCM:hover {color: grey;}._3cQMScbqW0:active {color: black;}}@supports (display:grid) {._3geGi3FQV5:focus {color: yellow;}._0vra6NbqW0:active {color: black;}}",
      ]
    `);
  });

  it('should inject at-rule-wrapped non-atomic rules into their own `cc` bucket, isolated from every atomic bucket', () => {
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

    // Non-atomic .cc- @media rules land in the dedicated `cc` bucket (its own
    // `<style>` element), preserving source order (cc-zzzzzz before cc-aaaaaa).
    // The atomic @media rule lands in the separate at-rule (`m`) bucket. The
    // two live on DIFFERENT DOM nodes — this is the isolation invariant that
    // prevents `Text.appendData` on the non-atomic bucket from wiping any
    // `sheet.insertRule()`-inserted atomic rules in production.
    //
    // The `m` bucket precedes the `cc` bucket in `styleBucketOrdering`, so the
    // atomic-`m` `<style>` appears first in `document.head`, then the `cc`
    // `<style>` — the cascade contract for `.cc-` (last-in-head) is preserved.
    const styleTexts = getStyleCssTexts().filter((t) => t.length > 0);
    expect(styleTexts).toMatchInlineSnapshot(`
      [
        "@media (min-width:1px) {._bbbbbbbb {color: blue;}}",
        "@media (min-width:1px) {.cc-zzzzzz .panel {background: gray;}}@media (min-width:1px) {.cc-aaaaaa .panel {background: pink;}}",
      ]
    `);
  });
});
