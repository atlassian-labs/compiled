import React from 'react';
import { hydrate } from 'react-dom';

import { CC, CS } from '../runtime';

jest.mock('../runtime/is-server-environment', () => ({
  isServerEnvironment: () => false,
}));

describe('server side hydrate', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error');
  });

  const flushRuntimeModule = () => {
    jest.resetModules();
    // We need to force this module to re-instantiate because on the client
    // when it does it will move all found SSRd style elements to the head.
    require('../runtime/style-cache');
  };

  const appendHTML = (markup: string) => {
    const elem = document.createElement('div');
    elem.innerHTML = markup;
    document.body.appendChild(elem);
    return elem;
  };

  it('should not log any warnings when hydrating HTML', () => {
    // It's notoriously hard to do both server and client rendering in this test.
    // Instead of doing the server flow we hardcode the result instead.
    const elem = appendHTML(
      `<style data-cmpld="true">.foo{color:blue}</style><div class="foo">hello world</div>`
    );

    flushRuntimeModule();
    hydrate(
      <CC>
        <CS>{['.foo { color: blue; }', '.foo { color: blue; }']}</CS>
        <div className="foo">hello world</div>
      </CC>,
      elem
    );

    expect(console.error).not.toHaveBeenCalled();
  });
});
