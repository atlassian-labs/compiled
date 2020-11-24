import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactDOM from 'react-dom';
import { styled } from '@compiled/react';

describe('server side hydrate', () => {
  beforeAll(() => {
    jest.spyOn(global.console, 'error');
  });

  const flushClientModules = () => {
    const originalName = process.release.name;
    delete process.release.name;
    jest.resetModules();
    // We need to force this module to re-instantiate because on the client
    // when it does it will move all found SSRd style elements to the  head.
    require('@compiled/react/runtime');

    return () => {
      process.release.name = originalName;
    };
  };

  const appendServerHTML = (markup: string) => {
    const elem = document.createElement('div');
    elem.innerHTML = markup;
    document.body.appendChild(elem);
    return elem;
  };

  it('should not log any warnings and cleanup style elements when hydrating HTML', () => {
    const StyledDiv = styled.div`
      font-size: 12px;
      color: blue;
      border: 1px solid black;
    `;

    const element = <StyledDiv>hello world</StyledDiv>;
    const app = appendServerHTML(renderToString(element));
    const reset = flushClientModules();
    ReactDOM.hydrate(element, app);
    reset();

    expect(console.error).not.toHaveBeenCalled();
    expect(document.querySelectorAll('style[data-cmpld]').length).toEqual(0);
  });
});
