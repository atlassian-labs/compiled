import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactDOM from 'react-dom';
import { styled } from '@compiled/core';

describe('server side hydrate', () => {
  it('should ssr then hydrate element correctly', () => {
    jest.spyOn(global.console, 'error').mockImplementation(() => {});

    const StyledDiv = styled.div`
      font-size: 12px;
      color: blue;
      border: 1px solid black;
    `;

    const element = <StyledDiv>hello world</StyledDiv>;

    const elem = document.createElement('div');
    elem.innerHTML = renderToString(element);

    const releaseName = process.release.name;
    // We have to delete this so that client code can execute properly
    delete process.release.name;

    ReactDOM.hydrate(element, elem);

    // Restore the release name after hydration is complete
    process.release.name = releaseName;

    const mockCalls = (console.error as jest.Mock).mock.calls.filter(
      ([f, s]) =>
        !(f === 'Warning: Did not expect server HTML to contain a <%s> in <%s>.%s' && s === 'style')
    );

    expect(mockCalls.length).toBe(0);
  });
});
