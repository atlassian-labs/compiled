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

  it('should warn in dev when using a dangerous pseduo selector', () => {
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

  it('should update styles', () => {
    createIsolatedTest((Style) => {
      const { rerender } = render(<Style>{[`.first-render { display: block; }`]}</Style>);

      rerender(<Style>{[`.second-render { display: block; }`]}</Style>);

      expect(document.head.innerHTML).toInclude('.second-render { display: block; }');
      expect(console.error).not.toHaveBeenCalled();
    });
  });
});
