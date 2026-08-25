import compiledVitePlugin from '../index';

describe('compiledVitePlugin', () => {
  it('should create a plugin with the correct name', () => {
    const plugin = compiledVitePlugin();

    expect(plugin.name).toBe('@compiled/vite-plugin');
    expect(plugin.enforce).toBe('pre');
    expect(Array.isArray(plugin)).toBe(false);
  });

  it('only proxies client-side script imports while serving', async () => {
    const plugin: any = compiledVitePlugin();
    const context = {
      resolve: jest.fn().mockResolvedValue({
        id: '/project/styles.compiled.css',
      }),
    };
    const resolveOptions = {
      attributes: {},
      isEntry: false,
    };

    plugin.configResolved({ base: '/', command: 'serve' });

    const proxyId = await plugin.resolveId.call(
      context,
      './styles.compiled.css',
      '/project/entry.ts',
      resolveOptions
    );
    expect(proxyId).toMatch(/^\0virtual:@compiled\/vite-plugin\/css-proxy:.*\.js$/);
    expect(context.resolve).toHaveBeenCalledWith(
      './styles.compiled.css',
      '/project/entry.ts',
      expect.objectContaining({ skipSelf: true })
    );

    await expect(
      plugin.resolveId.call(context, './styles.compiled.css', '/project/entry.ts', {
        ...resolveOptions,
        ssr: true,
      })
    ).resolves.toBeNull();
    await expect(
      plugin.resolveId.call(context, './styles.compiled.css', '/project/entry.ts', {
        ...resolveOptions,
        scan: true,
      })
    ).resolves.toBeNull();
    await expect(
      plugin.resolveId.call(
        context,
        './styles.compiled.css',
        '/project/importer.css',
        resolveOptions
      )
    ).resolves.toBeNull();
    await expect(
      plugin.resolveId.call(
        context,
        './styles.compiled.css?inline',
        '/project/entry.ts',
        resolveOptions
      )
    ).resolves.toBeNull();

    plugin.configResolved({ base: '/', command: 'build' });
    await expect(
      plugin.resolveId.call(context, './styles.compiled.css', '/project/entry.ts', resolveOptions)
    ).resolves.toBeNull();
  });

  it('registers local development rules with the sorted stylesheet', async () => {
    const plugin: any = compiledVitePlugin();
    const resolveOptions = { attributes: {}, isEntry: false };
    const context = { resolve: jest.fn() };
    const id = '/project/local.tsx';

    plugin.configResolved({ base: '/', command: 'serve' });
    const result = await plugin.transform!(
      `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ display: 'flex' })} />;
      `,
      id
    );

    expect(result.code).toContain('virtual:@compiled/vite-plugin/local-css:');
    expect(result.code).not.toContain('CS');

    const source = result.code.match(/"(virtual:@compiled\/vite-plugin\/local-css:[^"]+)"/)?.[1];
    expect(source).toBeDefined();
    const virtualId = await plugin.resolveId.call(context, source, id, resolveOptions);
    const module = plugin.load(virtualId);

    expect(module).toContain('registerCompiledCss');
    expect(module).toContain('unregisterCompiledCss');
    expect(module).toContain('import.meta.hot.prune');
    expect(module).toContain('display:flex');

    const resultWithoutStyles = await plugin.transform!(
      `
        import { css } from '@compiled/react';
        export const Component = () => <div />;
      `,
      id
    );

    expect(resultWithoutStyles.code).not.toContain('virtual:@compiled/vite-plugin/local-css:');
    expect(plugin.load(virtualId)).toBeNull();
  });

  it('keeps dev SSR transforms on the existing runtime path', async () => {
    const plugin: any = compiledVitePlugin();
    const id = '/project/server.tsx';
    const code = `
      import { css } from '@compiled/react';
      export const Component = () => <div css={css({ display: 'flex' })} />;
    `;

    plugin.configResolved({ base: '/', command: 'serve' });
    const result = await plugin.transform(code, id, { ssr: true });

    expect(result.code).not.toContain('virtual:@compiled/vite-plugin/local-css:');
    expect(result.code).toContain('CC');
    expect(result.code).toContain('CS');
  });

  it('should transform code with Compiled imports', async () => {
    const plugin = compiledVitePlugin({ collisionResistantHash: true });
    const code = `
      import { css } from '@compiled/react';

      export const Component = () => (
        <div css={css({ color: 'red', fontSize: '12px' })}>
          Hello
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      // Check for the atomic class structure
      expect(result.code).toContain('_1UtDYzGowl');
      expect(result.code).toContain('color:red');
      expect(result.code).toContain('font-size:9pt'); // 12px gets normalized to 9pt
    }
  });

  it('keeps production transforms unchanged when extraction is disabled', async () => {
    const plugin: any = compiledVitePlugin();
    const code = `
      import { css } from '@compiled/react';
      export const Component = () => <div css={css({ display: 'flex' })} />;
    `;

    plugin.configResolved({ base: '/', command: 'build' });
    const result = await plugin.transform(code, '/project/production.tsx', { ssr: false });

    expect(result.code).not.toContain('virtual:@compiled/vite-plugin/local-css:');
    expect(result.code).toContain('CC');
    expect(result.code).toContain('CS');
  });

  it('extracts during builds independently of NODE_ENV and preserves the original source map', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    try {
      const plugin: any = compiledVitePlugin({ extract: true });
      const code = [
        "import { css } from '@compiled/react';",
        'export const Component = () => (',
        "  <div css={css({ display: 'flex' })}>source map target</div>",
        ');',
      ].join('\n');
      const emitFile = jest.fn();

      plugin.configResolved({ base: '/', command: 'build' });
      const result = await plugin.transform(code, '/project/extracted.tsx', { ssr: false });
      plugin.generateBundle.call({ emitFile, warn: jest.fn() }, {}, {});

      expect(result.code).not.toContain('CC');
      expect(result.code).not.toContain('CS');
      expect(result.map.sourcesContent).toEqual([code]);
      expect(emitFile).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'compiled-extracted.css',
          source: expect.stringContaining('display:flex'),
          type: 'asset',
        })
      );
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it('should skip files without Compiled imports', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import React from 'react';

      export const Component = () => <div>Hello</div>;
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeNull();
  });

  it('should skip non-JS/TS files', async () => {
    const plugin = compiledVitePlugin();
    const code = '.some-class { color: red; }';

    const result = await plugin.transform!(code, 'test.css');

    expect(result).toBeNull();
  });

  it('should sort extracted Compiled CSS during transformation', async () => {
    const plugin: any = compiledVitePlugin();
    const code =
      '@media (min-width: 768px) { ._fpol1q9b { color: blue } }' +
      '._bbbk3bke { border-bottom-color: orange }' +
      '._syaz1q9b { color: red }' +
      '._bxs1q9b { border: 2px solid transparent }';

    plugin.configResolved({ base: '/', command: 'serve' });
    const result = await plugin.transform(
      code,
      '/node_modules/@atlaskit/example/dist/styles.compiled.css',
      { ssr: false }
    );

    expect(result).toEqual({
      code:
        '._bxs1q9b { border: 2px solid transparent }' +
        '._bbbk3bke { border-bottom-color: orange }' +
        '._syaz1q9b { color: red }' +
        '@media (min-width: 768px) { ._fpol1q9b { color: blue } }',
      map: null,
    });
  });

  it('does not sort extracted Compiled CSS outside client development transforms', async () => {
    const plugin: any = compiledVitePlugin();
    const code = '._syaz1q9b { color: red }';
    const id = '/node_modules/@atlaskit/example/dist/styles.compiled.css';

    plugin.configResolved({ base: '/', command: 'build' });
    await expect(plugin.transform(code, id, { ssr: false })).resolves.toBeNull();

    plugin.configResolved({ base: '/', command: 'serve' });
    await expect(plugin.transform(code, id, { ssr: true })).resolves.toBeNull();
  });

  it('should preserve invalid extracted Compiled CSS when sorting fails', async () => {
    const plugin: any = compiledVitePlugin();
    const context = { warn: jest.fn() };
    const code = '._syaz1q9b { color: red';
    const id = '/node_modules/@atlaskit/example/dist/styles.compiled.css';

    plugin.configResolved({ base: '/', command: 'serve' });
    const result = await plugin.transform.call(context, code, id, { ssr: false });

    expect(result).toBeNull();
    expect(context.warn).toHaveBeenCalledWith({
      message: expect.stringContaining(`Failed to sort CSS in ${id}`),
    });
  });

  it('should skip node_modules/@compiled/react', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { css } from '@compiled/react';
      export const styled = {};
    `;

    const result = await plugin.transform!(code, '/node_modules/@compiled/react/dist/index.js');

    expect(result).toBeNull();
  });

  it('should handle styled components', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { styled } from '@compiled/react';

      export const StyledDiv = styled.div({
        color: 'blue',
        padding: '8px',
      });
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('color:blue');
      // Padding gets split into longhand properties
      expect(result.code).toContain('padding-top:8px');
      expect(result.code).toContain('forwardRef'); // Styled components use forwardRef
    }
  });

  it('should respect custom importSources', async () => {
    const plugin = compiledVitePlugin({
      importSources: ['@custom/styled'],
    });
    const code = `
      import { css } from '@custom/styled';

      export const Component = () => (
        <div css={css({ margin: '16px' })}>
          Hello
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      // Margin gets split into longhand properties, and 16px may be normalized to 1pc
      expect(result.code).toContain('margin-top:');
      expect(result.code).toContain('CC'); // Check for Compiled runtime components
    }
  });

  it('should handle errors gracefully', async () => {
    const plugin = compiledVitePlugin();
    const mockError = jest.fn();

    // Create a mock context with an error method
    const context = {
      error: mockError,
    };

    const invalidCode = `
      import { css } from '@compiled/react';
      
      // Invalid syntax
      const broken = css({
        color
    `;

    await plugin.transform!.call(context, invalidCode, 'test.tsx');

    expect(mockError).toHaveBeenCalled();
  });

  it('should apply default options', () => {
    const plugin = compiledVitePlugin();

    expect(plugin.name).toBe('@compiled/vite-plugin');
    expect(plugin.enforce).toBe('pre');
  });

  it('should accept custom options', async () => {
    const plugin = compiledVitePlugin({
      bake: true,
      extract: false,
      ssr: false,
      addComponentName: true,
    });

    const code = `
      import { styled } from '@compiled/react';

      export const Button = styled.button({ color: 'green' });
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
  });

  it('should handle keyframes', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { keyframes, css } from '@compiled/react';

      const fadeIn = keyframes({
        from: { opacity: 0 },
        to: { opacity: 1 },
      });

      export const Component = () => (
        <div css={css({ animation: \`\${fadeIn} 0.3s ease-out\` })}>
          Animated
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      // Should contain keyframes reference
      expect(result.code).toContain('keyframes');
      expect(result.code).toContain('opacity');
    }
  });

  it('should handle cssMap', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        primary: { backgroundColor: '#0052CC', color: 'white' },
        secondary: { backgroundColor: '#E0E0E0', color: 'black' },
      });

      export const Component = ({ variant }) => (
        <div css={styles[variant]}>
          Button
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      // Should contain the color values (normalized to lowercase)
      expect(result.code).toContain('#0052cc');
      expect(result.code).toContain('#fff');
    }
  });

  it('should handle ClassNames component', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { ClassNames } from '@compiled/react';

      export const Component = () => (
        <ClassNames>
          {({ css, style }) => (
            <div
              style={style}
              className={css({ fontSize: '20px', fontWeight: 'bold' })}
            >
              Dynamic
            </div>
          )}
        </ClassNames>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('font-size');
      expect(result.code).toContain('font-weight');
    }
  });

  it('should handle nested pseudo-selectors', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { css } from '@compiled/react';

      export const Component = () => (
        <div css={css({
          color: 'blue',
          ':hover': { color: 'red' },
          ':focus': { outline: '2px solid blue' },
        })}>
          Interactive
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('color:blue');
      expect(result.code).toContain(':hover');
      expect(result.code).toContain('color:red');
      expect(result.code).toContain(':focus');
    }
  });

  it('should handle media queries', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { css } from '@compiled/react';

      export const Component = () => (
        <div css={css({
          padding: '16px',
          '@media (min-width: 768px)': {
            padding: '32px',
          },
        })}>
          Responsive
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('padding');
      expect(result.code).toContain('@media');
      expect(result.code).toContain('min-width');
    }
  });

  it('should handle template literal styles', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { css } from '@compiled/react';

      export const Component = () => (
        <div css={css\`
          color: purple;
          font-size: 18px;
          &:hover {
            color: darkpurple;
          }
        \`}>
          Styled
        </div>
      );
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('color:purple');
      expect(result.code).toContain('font-size');
    }
  });

  it('should handle styled component with template literal', async () => {
    const plugin = compiledVitePlugin();
    const code = `
      import { styled } from '@compiled/react';

      export const Card = styled.div\`
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      \`;
    `;

    const result = await plugin.transform!(code, 'test.tsx');

    expect(result).toBeTruthy();
    if (result && typeof result === 'object' && 'code' in result) {
      expect(result.code).toContain('background');
      expect(result.code).toContain('border-radius');
      expect(result.code).toContain('box-shadow');
    }
  });
});
