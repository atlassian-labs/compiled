import compiledVitePlugin from '../index';

describe('CSS Extraction', () => {
  describe('Extract mode transformation', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should transform code with extraction enabled', async () => {
      const plugin = compiledVitePlugin({ extract: true });
      const code = `
        import { css } from '@compiled/react';

        export const Component = () => (
          <div css={css({ color: 'red', fontSize: '14px' })}>
            Hello
          </div>
        );
      `;

      const result = await plugin.transform!(code, 'test.tsx');

      expect(result).toBeTruthy();
      if (result && typeof result === 'object' && 'code' in result) {
        // In extract mode, the code should not include the style rules inline
        // but should still have the class names
        expect(result.code).toMatch(/_syaz|_1wyb/);
      }
    });

    it('should collect style rules during transformation', async () => {
      const plugin = compiledVitePlugin({ extract: true });
      const code = `
        import { css } from '@compiled/react';

        export const Component = () => (
          <div css={css({ backgroundColor: '#00875a', padding: '20px' })}>
            Content
          </div>
        );
      `;

      const result = await plugin.transform!(code, 'test.tsx');

      expect(result).toBeTruthy();
      // The actual CSS collection happens via metadata in the plugin
      // which is tested via integration in the example builds
    });
  });

  describe('generateBundle hook', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should have generateBundle hook', () => {
      const plugin = compiledVitePlugin({ extract: true });

      expect(plugin.generateBundle).toBeDefined();
      expect(typeof plugin.generateBundle).toBe('function');
    });

    it('should emit extracted CSS file when extraction is enabled', async () => {
      const plugin = compiledVitePlugin({ extract: true });
      const emittedFiles: any[] = [];

      // Mock context with emitFile
      const context = {
        emitFile: (file: any) => {
          emittedFiles.push(file);
          return 'mock-ref';
        },
        warn: jest.fn(),
      };

      // Transform some code first to collect styles
      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ margin: '10px' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      // Call generateBundle with empty bundle
      await plugin.generateBundle.call(context, {}, {});

      // Check that extracted CSS file was emitted
      expect(emittedFiles.length).toBe(1);
      expect(emittedFiles[0]).toMatchObject({
        type: 'asset',
        name: 'compiled-extracted.css',
      });
      expect(typeof emittedFiles[0].source).toBe('string');
      expect(emittedFiles[0].source.length).toBeGreaterThan(0);
    });

    it('should not emit CSS file when extraction is disabled', async () => {
      const plugin = compiledVitePlugin({ extract: false });
      const emittedFiles: any[] = [];

      const context = {
        emitFile: (file: any) => {
          emittedFiles.push(file);
        },
        warn: jest.fn(),
      };

      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ color: 'red' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      await plugin.generateBundle.call(context, {}, {});

      expect(emittedFiles.length).toBe(0);
    });

    it('should not emit CSS file in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const plugin = compiledVitePlugin({ extract: true });
      const emittedFiles: any[] = [];

      const context = {
        emitFile: (file: any) => {
          emittedFiles.push(file);
        },
        warn: jest.fn(),
      };

      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ color: 'red' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      await plugin.generateBundle.call(context, {}, {});

      expect(emittedFiles.length).toBe(0);
    });

    it('should apply sorting and deduplication to CSS assets containing Compiled styles', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock bundle with a CSS asset containing Compiled styles
      const bundle = {
        'index.css': {
          type: 'asset',
          fileName: 'index.css',
          source: '._syaz13q2{color:blue}\n._syaz13q2{color:blue}\n._1wyb1fwx{font-size:12px}',
        },
      };

      const context = {
        emitFile: jest.fn(),
        warn: jest.fn(),
      };

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, bundle);

      // Check that the CSS was processed (duplicates removed and sorted)
      const processedCss = bundle['index.css'].source as string;

      // Should have removed duplicate
      const blueColorMatches = (processedCss.match(/color:blue/g) || []).length;
      expect(blueColorMatches).toBe(1);

      // Should still contain both rules
      expect(processedCss).toContain('color:blue');
      expect(processedCss).toContain('font-size');
    });

    it('should not process CSS assets without Compiled atomic classes', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock bundle with non-Compiled CSS
      const originalCss = '.regular-class { color: red; }';
      const bundle = {
        'other.css': {
          type: 'asset',
          fileName: 'other.css',
          source: originalCss,
        },
      };

      const context = {
        emitFile: jest.fn(),
        warn: jest.fn(),
      };

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, bundle);

      // CSS should remain unchanged (no atomic classes to process)
      expect(bundle['other.css'].source).toBe(originalCss);
    });

    it('should sort pseudo-selectors in the correct order', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock bundle with pseudo-selectors in wrong order
      // Correct order: :link → :visited → :focus-within → :focus → :hover → :active
      const bundle = {
        'index.css': {
          type: 'asset',
          fileName: 'index.css',
          source:
            '._abc:active{color:red}._abc:hover{color:blue}._abc:focus{color:green}._abc:link{color:yellow}',
        },
      };

      const context = {
        emitFile: jest.fn(),
        warn: jest.fn(),
      };

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, bundle);

      const processedCss = bundle['index.css'].source as string;

      // Check that pseudo-selectors are in the correct order
      const linkIndex = processedCss.indexOf(':link');
      const focusIndex = processedCss.indexOf(':focus');
      const hoverIndex = processedCss.indexOf(':hover');
      const activeIndex = processedCss.indexOf(':active');

      expect(linkIndex).toBeLessThan(focusIndex);
      expect(focusIndex).toBeLessThan(hoverIndex);
      expect(hoverIndex).toBeLessThan(activeIndex);
    });

    it('should preserve duplicates in different at-rule contexts', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock bundle with same rule in different contexts
      const bundle = {
        'index.css': {
          type: 'asset',
          fileName: 'index.css',
          source: '@media(min-width:768px){._abc{color:red}}._abc{color:red}',
        },
      };

      const context = {
        emitFile: jest.fn(),
        warn: jest.fn(),
      };

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, bundle);

      const processedCss = bundle['index.css'].source as string;

      // Both instances should be preserved (different cascade contexts)
      const matches = (processedCss.match(/color:red/g) || []).length;
      expect(matches).toBe(2);
      expect(processedCss).toContain('@media');
    });

    it('should produce deterministic output across multiple runs', async () => {
      const plugin1 = compiledVitePlugin({ extract: true });
      const plugin2 = compiledVitePlugin({ extract: true });

      const inputCss = '._z{z-index:1}._a{color:red}._m{margin:10px}._z{z-index:1}';

      const bundle1 = {
        'index.css': {
          type: 'asset',
          fileName: 'index.css',
          source: inputCss,
        },
      };

      const bundle2 = {
        'index.css': {
          type: 'asset',
          fileName: 'index.css',
          source: inputCss,
        },
      };

      const context = {
        emitFile: jest.fn(),
        warn: jest.fn(),
      };

      // Process with two different plugin instances
      await plugin1.generateBundle.call(context, {}, bundle1);
      await plugin2.generateBundle.call(context, {}, bundle2);

      // Output should be identical
      expect(bundle1['index.css'].source).toBe(bundle2['index.css'].source);
    });
  });

  describe('HTML injection', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should inject extracted CSS into HTML', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock context for generateBundle
      let emittedFileName = '';
      const context = {
        emitFile: (file: any) => {
          // Simulate Vite's content hashing
          emittedFileName = `assets/${file.name.replace('.css', '-abc123.css')}`;
          return 'mock-ref-id';
        },
        warn: jest.fn(),
      };

      // Transform code to collect styles
      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ color: 'blue' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      // Call generateBundle to emit the CSS file
      await plugin.generateBundle.call(context, {}, {});

      // Mock bundle with the emitted CSS
      const bundle = {
        [emittedFileName]: {
          type: 'asset',
          name: 'compiled-extracted.css',
          fileName: emittedFileName,
          source: '._syaz13q2{color:blue}',
        },
      };

      const html = '<html><head></head><body></body></html>';
      const ctx = { bundle };

      // Call transformIndexHtml
      const result = plugin.transformIndexHtml!(html, ctx);

      // Should inject a link tag
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toMatchObject({
        tag: 'link',
        attrs: {
          rel: 'stylesheet',
          href: '/assets/compiled-extracted-abc123.css',
        },
        injectTo: 'head',
      });
    });

    it('should not inject HTML if no styles were extracted', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Don't transform any code (no styles collected)
      const html = '<html><head></head><body></body></html>';
      const ctx = { bundle: {} };

      // Call transformIndexHtml
      const result = plugin.transformIndexHtml!(html, ctx);

      // Should return empty array
      expect(result).toEqual([]);
    });

    it('should use content-hashed filenames for extracted CSS', async () => {
      const plugin = compiledVitePlugin({ extract: true });
      const emittedFiles: any[] = [];

      const context = {
        emitFile: (file: any) => {
          emittedFiles.push(file);
          return 'mock-ref-id';
        },
        warn: jest.fn(),
      };

      // Transform code to collect styles
      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ padding: '10px' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, {});

      // Check that it uses 'name' (for content hashing) not 'fileName' (static name)
      expect(emittedFiles.length).toBe(1);
      expect(emittedFiles[0]).toHaveProperty('name', 'compiled-extracted.css');
      expect(emittedFiles[0]).not.toHaveProperty('fileName');
    });
  });
});
