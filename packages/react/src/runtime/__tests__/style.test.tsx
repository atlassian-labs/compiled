import { render } from '@testing-library/react';
import React from 'react';
import type { ComponentType } from 'react';

import StyleWithContainer from '../style';
import { StyleContainerProvider } from '../style-container';
import type * as StyleContainerModule from '../style-container';

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
  const createIsolatedTest = (
    callback: (Style: ComponentType<{ children: string[]; nonce?: string }>) => void
  ) => {
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

  describe('cssMapScoped — non-atomic style injection', () => {
    it('should inject cssMapScoped rules into the catch-all style bucket, not a shorthand bucket', () => {
      createIsolatedTest((Style) => {
        // border-bottom is shorthand depth 4 → would normally go to s-4 bucket
        // but cc- rules must always go to the catch-all '' bucket
        const sharedRule =
          '.cc-abc123 .ProseMirror .blur,.focus{border-bottom:2px solid transparent}';
        render(<Style>{[sharedRule]}</Style>);

        // Rule should be injected into a style element in the head
        expect(document.head.innerHTML).toInclude(sharedRule);
        // Should only be one style element (catch-all '' bucket), not split into s-4
        expect(document.head.querySelectorAll('style')).toHaveLength(1);
      });
    });

    it('should preserve source order — shared base rule before individual overrides', () => {
      createIsolatedTest((Style) => {
        // This mirrors the real annotation styles cascade issue:
        // shared multi-selector (border-bottom shorthand) must appear BEFORE
        // individual overrides (border-bottom-color longhand) in the style tag.
        const sharedRule =
          '.cc-abc123 .ProseMirror .blur,.focus{border-bottom:2px solid transparent}';
        const overrideRule =
          '.cc-abc123 .ProseMirror .focus{background:yellow;border-bottom-color:orange}';

        render(<Style>{[sharedRule, overrideRule]}</Style>);

        const styleContent = document.head.innerHTML;
        const sharedIdx = styleContent.indexOf('border-bottom:2px solid transparent');
        const overrideIdx = styleContent.indexOf('border-bottom-color:orange');

        expect(sharedIdx).toBeGreaterThan(-1);
        expect(overrideIdx).toBeGreaterThan(-1);
        // Shared base must appear BEFORE individual override in the DOM
        expect(sharedIdx).toBeLessThan(overrideIdx);
      });
    });

    it('should keep all rules for a variant in the same bucket regardless of their first CSS property', () => {
      createIsolatedTest((Style) => {
        // background → shorthand depth 1 → s-1 bucket (without fix)
        // border-bottom → shorthand depth 4 → s-4 bucket (without fix)
        // Both should land in '' catch-all bucket with the fix
        const bgRule = '.cc-def456 .panel{background:blue;color:white}';
        const borderRule = '.cc-def456 .title{border-bottom:1px solid red;font-weight:bold}';

        render(<Style>{[bgRule, borderRule]}</Style>);

        const styleContent = document.head.innerHTML;
        const bgIdx = styleContent.indexOf('background:blue');
        const borderIdx = styleContent.indexOf('border-bottom:1px solid red');

        expect(bgIdx).toBeGreaterThan(-1);
        expect(borderIdx).toBeGreaterThan(-1);
        // Both in same bucket → source order preserved
        expect(bgIdx).toBeLessThan(borderIdx);
      });
    });

    it('should inject atomic cssMap rules and cssMapScoped rules into separate buckets', () => {
      createIsolatedTest((Style) => {
        // atomic rule: border-bottom shorthand → s-4 bucket
        // non-atomic rule: cc- → '' catch-all bucket
        const atomicRule = '._1abc2def{border-bottom:2px solid blue}';
        const nonAtomicRule = '.cc-abc123 .panel{border-bottom:1px solid red;padding:8px}';

        render(<Style>{[atomicRule, nonAtomicRule]}</Style>);

        const styleContent = document.head.innerHTML;
        expect(styleContent).toInclude(atomicRule);
        expect(styleContent).toInclude(nonAtomicRule);
      });
    });
  });

  describe('StyleContainerProvider', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should insert styles into the provided container instead of document.head', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>{[`.a { color: red; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('.a { color: red; }');
      expect(document.head.innerHTML).not.toInclude('.a { color: red; }');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should maintain bucket ordering within the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>
            {[
              `._a1234567:hover{ color: red; }`,
              `._b1234567:active{ color: blue; }`,
              `._c1234567{ display: block; }`,
              `@media (max-width: 800px){ ._d1234567{ color: yellow; } }`,
            ]}
          </StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML.split('</style>').join('</style>\n')).toMatchInlineSnapshot(`
        "<style>._c1234567{ display: block; }</style>
        <style>._a1234567:hover{ color: red; }</style>
        <style>._b1234567:active{ color: blue; }</style>
        <style>@media (max-width: 800px){ ._d1234567{ color: yellow; } }</style>
        "
      `);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should not insert duplicate styles into the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer>{[`.b { color: blue; }`]}</StyleWithContainer>
          <StyleWithContainer>{[`.b { color: blue; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toIncludeRepeated('.b { color: blue; }', 1);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should track container and document.head caches independently using cacheKey', () => {
      // Render the same style into both the main document and a container.
      // Each should receive its own copy since they are independent targets.
      render(<StyleWithContainer>{[`.c { color: green; }`]}</StyleWithContainer>);

      render(
        <StyleContainerProvider container={container} cacheKey="shadow">
          <StyleWithContainer>{[`.c { color: green; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(document.head.innerHTML).toInclude('.c { color: green; }');
      expect(container.innerHTML).toInclude('.c { color: green; }');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should track two containers independently using different cacheKeys', () => {
      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      render(
        <StyleContainerProvider container={container} cacheKey="shadow-a">
          <StyleWithContainer>{[`.d { color: pink; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      render(
        <StyleContainerProvider container={container2} cacheKey="shadow-b">
          <StyleWithContainer>{[`.d { color: pink; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('.d { color: pink; }');
      expect(container2.innerHTML).toInclude('.d { color: pink; }');

      document.body.removeChild(container2);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should forward nonce to style elements in the container', () => {
      render(
        <StyleContainerProvider container={container} cacheKey="test">
          <StyleWithContainer nonce="abc123">{[`.e { color: orange; }`]}</StyleWithContainer>
        </StyleContainerProvider>
      );

      expect(container.innerHTML).toInclude('nonce="abc123"');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should warn in dev when used in a server environment', () => {
      jest.resetModules();
      jest.doMock('../is-server-environment', () => ({
        isServerEnvironment: () => true,
      }));

      // Re-require to pick up the new mock
      const { StyleContainerProvider: ServerStyleContainerProvider } =
        jest.requireActual<typeof StyleContainerModule>('../style-container');

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const { container: renderContainer } = render(
        <ServerStyleContainerProvider container={container} cacheKey="test">
          <div />
        </ServerStyleContainerProvider>
      );

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '@compiled/react: StyleContainerProvider has no effect in server environments.'
        )
      );
      // Children should still be rendered
      expect(renderContainer.querySelector('div')).not.toBeNull();

      warnSpy.mockRestore();
      jest.resetModules();
    });
  });
});
