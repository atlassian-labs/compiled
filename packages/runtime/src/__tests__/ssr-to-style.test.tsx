import React from 'react';
import { render } from '@testing-library/react';
import Style from '../style';

jest.mock('../is-node', () => ({
  isNodeEnvironment: () => false,
}));

describe('ssr-to-style', () => {
  beforeEach(() => {
    // We can't replicate ssr => client behaviour by setting `isNodeEnvironment`
    // to `true` and then `false`. So instead we are injecting styles and element
    // in body before client starts rendering.
    document.body.innerHTML = `<style nonce=\\"k0Mp1lEd\\" data-compiled-style=\\"\\">._36l6dlk8{font-size:14px}</style><style nonce=\\"k0Mp1lEd\\" data-compiled-focus=\\"\\">._t5glbf54:focus{color:green}</style><a href=\\"https://atlassian.design\\" class=\\"_36l6dlk8 _t5glbf54\\">Atlassian Design System</a><style nonce=\\"k0Mp1lEd\\" data-compiled-style=\\"\\">._36l6dlk8{font-size:14px}</style><div class=\\"_36l6dlk8\\">hello world</div>`;
  });

  it('should move styles rendered from server to head', () => {
    const { baseElement } = render(
      <Style>{['._36l6dlk8{font-size:14px}', '._t5glbf54:focus{color:green}']}</Style>
    );

    expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
      "<style data-compiled-style=\\"\\">._36l6dlk8{font-size:14px}</style>
      <style data-compiled-focus=\\"\\">._t5glbf54:focus{color:green}</style>
      "
    `);

    expect(baseElement.getElementsByTagName('style')).toHaveLength(0);
  });
});
