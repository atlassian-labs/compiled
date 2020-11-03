import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactDOM from 'react-dom';
import { styled } from '@compiled/core';

describe('server side hydrate', () => {
  it('it should not log unexpected warnings when hydrating SSRing', () => {
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

    // We will get mismatches for the style rendering but this is expected because
    // we inline the style elements in the server rendered markup and then on the client
    // when the JavaScript initializes they get moved to the head of the document.
    const mockCalls = (console.error as jest.Mock).mock.calls.filter(
      ([f, s]) =>
        !(f === 'Warning: Did not expect server HTML to contain a <%s> in <%s>.%s' && s === 'style')
    );

    expect(mockCalls.length).toBe(0);
  });
});
