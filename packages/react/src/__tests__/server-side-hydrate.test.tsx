import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactDOM from 'react-dom';
import { styled } from '@compiled/react';
import { isNodeEnvironment } from '@compiled/react/dist/runtime/is-node';
import { useCache } from '@compiled/react/dist/runtime/provider';

jest.mock('@compiled/react/dist/runtime/is-node');

describe('server side hydrate', () => {
  beforeEach(() => {
    jest.spyOn(global.console, 'error');
    flushEnvironment('node');
  });

  const flushEnvironment = (env: 'node' | 'browser') => {
    // This isn't a real hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const cache = useCache();
    for (const key in cache) {
      // Flush the cache out - unfortunately it persisted between tests.
      delete cache[key];
    }
    (isNodeEnvironment as jest.Mock).mockReturnValue(env === 'node');
    jest.resetModules();
    // We need to force this module to re-instantiate because on the client
    // when it does it will move all found SSRd style elements to the head.
    require('@compiled/react/runtime');
  };

  const appendHTML = (markup: string) => {
    const elem = document.createElement('div');
    elem.innerHTML = markup;
    document.body.appendChild(elem);
    return elem;
  };

  it('should not log any warnings and cleanup SSRd styles when hydrating HTML', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
      color: blue;
      border: 1px solid black;
    `;

    const element = <StyledDiv>hello world</StyledDiv>;
    const app = appendHTML(renderToString(element));
    flushEnvironment('browser');
    ReactDOM.hydrate(element, app);

    expect(console.error).not.toHaveBeenCalled();
    expect(document.querySelectorAll('style[data-cmpld]').length).toEqual(0);
  });
});
