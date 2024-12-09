import { render } from '@testing-library/react';
import React from 'react';
import type { ComponentType } from 'react';

jest.mock('../is-server-environment', () => ({
  isServerEnvironment: () => false,
}));

describe('<Style />', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    document.head.innerHTML = '';
  });

  // We want to isolate the test to correctly mimic the environment being loaded in once
  const createIsolatedTest = (callback: (Style: ComponentType) => void) => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Style = require('../style');

      callback(Style.default);
    });
  };

  it('should render nothing on the client', () => {
    createIsolatedTest((Style) => {
      const { baseElement } = render(<Style>{[`.a { display: block; }`]}</Style>);

      expect(baseElement.getElementsByTagName('style')).toHaveLength(0);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should add style to the head on the client', () => {
    createIsolatedTest((Style) => {
      render(<Style>{[`.b { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toInclude('<style>.b { display: block; }</style>');
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should only add one style if it was already added', () => {
    createIsolatedTest((Style) => {
      render(<Style>{[`.c { display: block; }`]}</Style>);
      render(<Style>{[`.c { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toIncludeRepeated('<style>.c { display: block; }</style>', 1);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should noop in prod', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'production';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should warn in dev when using a dangerous pseudo selector', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'development';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should warn in dev only once', () => {
    createIsolatedTest((Style) => {
      process.env.NODE_ENV = 'development';

      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);
      render(<Style>{[`.c:first-child { display: block; }`]}</Style>);

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching('Selectors ":first-child, :nth-child" are dangerous to use')
      );
    });
  });

  it('should render style tags in buckets', () => {
    createIsolatedTest((Style) => {
      render(
        <Style>
          {[
            `._a1234567:hover{ color: red; }`,
            `._b1234567:active{ color: blue; }`,
            `._c1234567:link{ color: green; }`,
            `._d1234567{ display: block; }`,
            `@media (max-width: 800px){ ._e1234567{ color: yellow; } }`,
            `._f1234567:focus{ color: pink; }`,
            `._g1234567:visited{ color: grey; }`,
            `._h1234567:focus-visible{ color: white; }`,
            `._i1234567:focus-within{ color: black; }`,
          ]}
        </Style>
      );

      expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._d1234567{ display: block; }</style>
        <style>._c1234567:link{ color: green; }</style>
        <style>._g1234567:visited{ color: grey; }</style>
        <style>._i1234567:focus-within{ color: black; }</style>
        <style>._f1234567:focus{ color: pink; }</style>
        <style>._h1234567:focus-visible{ color: white; }</style>
        <style>._a1234567:hover{ color: red; }</style>
        <style>._b1234567:active{ color: blue; }</style>
        <style>@media (max-width: 800px){ ._e1234567{ color: yellow; } }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should render shorthands in buckets', () => {
    // Our buckets don't actually support mixing pseudo-selectors with shorthand
    // properties, so the pseudo-selector buckets don't have correct shorthand
    // property order...
    createIsolatedTest((Style) => {
      render(
        <Style>
          {[
            `._a1234567:hover{ all: revert; }`,
            `._a1234567{ all: unset; }`,
            `._b1234567{ border: solid 1px blue; }`,
            `._c1234567{ border-block: solid 2px blue; }`,
            `._d1234567{ border-block-end: solid 3px blue; }`,
            `._e1234567{ border-bottom: solid 4px blue; }`,
            `._g1234567{ border-inline: solid 5px blue; }`,
            `._h1234567{ border-top: solid 6px blue; }`,
            `._i1234567{ border-top-color: pink; }`,
            `._j1234567{ padding: 5px; }`,
            `._k1234567{ padding-block: 6px; }`,
            `._l1234567{ padding-inline: 7px; }`,
            `._m1234567{ padding-top: 8px; }`,

            `._g1234567:hover{ border-inline: solid 5px blue; }`,
            `._k1234567:hover{ padding-block: 6px; }`,
            `._l1234567:hover{ padding-inline: 7px; }`,
            `._j1234567:hover{ padding: 5px; }`,
          ]}
        </Style>
      );
      expect(document.head.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._a1234567{ all: unset; }</style>
        <style>._b1234567{ border: solid 1px blue; }._j1234567{ padding: 5px; }</style>
        <style>._k1234567{ padding-block: 6px; }._l1234567{ padding-inline: 7px; }</style>
        <style>._c1234567{ border-block: solid 2px blue; }._g1234567{ border-inline: solid 5px blue; }</style>
        <style>._e1234567{ border-bottom: solid 4px blue; }._h1234567{ border-top: solid 6px blue; }</style>
        <style>._d1234567{ border-block-end: solid 3px blue; }</style>
        <style>._i1234567{ border-top-color: pink; }._m1234567{ padding-top: 8px; }</style>
        <style>._a1234567:hover{ all: revert; }._g1234567:hover{ border-inline: solid 5px blue; }._k1234567:hover{ padding-block: 6px; }._l1234567:hover{ padding-inline: 7px; }._j1234567:hover{ padding: 5px; }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  it('should update styles', () => {
    createIsolatedTest((Style) => {
      const { rerender } = render(<Style>{[`.first-render { display: block; }`]}</Style>);

      rerender(<Style>{[`.second-render { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toInclude('.second-render { display: block; }');
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
