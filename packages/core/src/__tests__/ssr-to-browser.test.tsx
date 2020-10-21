import React from 'react';
import { render } from '@testing-library/react';
import { styled } from '@compiled/core';

jest.mock('../../../runtime/dist/is-node', () => ({
  isNodeEnvironment: () => false,
}));

describe.skip('ssr-to-browser', () => {
  beforeEach(() => {
    // We can't replicate ssr => client behaviour by setting `isNodeEnvironment`
    // to `true` and then `false`. So instead we are injecting styles and element
    // in body before client starts rendering.
    document.body.innerHTML = `<style nonce=\\"k0Mp1lEd\\" data-compiled-style=\\"\\">._36l6dlk8{font-size:14px}</style><style nonce=\\"k0Mp1lEd\\" data-compiled-focus=\\"\\">._t5glbf54:focus{color:green}</style><a href=\\"https://atlassian.design\\" class=\\"_36l6dlk8 _t5glbf54\\">Atlassian Design System</a>`;
  });

  it('should move styles rendered from server to head', () => {
    const StyledLink = styled.a`
      font-size: 14px;
      :focus {
        color: green;
      }
    `;

    const { baseElement } = render(
      <StyledLink href="https://atlassian.design">Atlassian Design System</StyledLink>
    );

    expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style nonce=\\"k0Mp1lEd\\" data-compiled-style=\\"\\">._36l6dlk8{font-size:14px}._1wybdlk8{font-size:14px}</style>
      <style nonce=\\"k0Mp1lEd\\" data-compiled-focus=\\"\\">._t5glbf54:focus{color:green}._f8pjbf54:focus{color:green}</style>
      "
    `);

    expect(baseElement.getElementsByTagName('style')).toHaveLength(0);
  });
});
