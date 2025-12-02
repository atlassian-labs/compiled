import compiledVitePlugin from '../index';
import { collectDistributedStyles } from '../utils';

describe('CSS Extraction', () => {
  describe('collectDistributedStyles', () => {
    it('should return empty array for non-existent paths', () => {
      const result = collectDistributedStyles(['/non/existent/path']);
      expect(result).toEqual([]);
    });

    it('should handle empty input', () => {
      const result = collectDistributedStyles([]);
      expect(result).toEqual([]);
    });

    // Note: Full integration tests would require setting up actual .compiled.css files
    // For now, the unit tests verify the basic structure works
  });

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

  describe('transformIndexHtml hook', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should have transformIndexHtml hook with correct structure', () => {
      const plugin = compiledVitePlugin({ extract: true });

      expect(plugin.transformIndexHtml).toBeDefined();
      expect(typeof plugin.transformIndexHtml).toBe('object');
      expect(plugin.transformIndexHtml.order).toBe('post');
      expect(typeof plugin.transformIndexHtml.handler).toBe('function');
    });

    it('should return empty array when extraction is disabled', () => {
      const plugin = compiledVitePlugin({ extract: false });
      const result = plugin.transformIndexHtml.handler();

      expect(result).toEqual([]);
    });

    it('should return empty array in development mode', () => {
      process.env.NODE_ENV = 'development';
      const plugin = compiledVitePlugin({ extract: true });
      const result = plugin.transformIndexHtml.handler();

      expect(result).toEqual([]);
    });

    it('should return CSS link descriptor when extraction is enabled in production', async () => {
      const plugin = compiledVitePlugin({ extract: true });

      // First, transform some code to populate collectedStyleRules
      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ color: 'blue' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      // Now check the HTML transformation
      const result = plugin.transformIndexHtml.handler();

      expect(result).toEqual([
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: '/compiled.css',
          },
          injectTo: 'head',
        },
      ]);
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

    it('should emit CSS file when extraction is enabled', async () => {
      const plugin = compiledVitePlugin({ extract: true });
      const emittedFiles: any[] = [];

      // Mock context with emitFile
      const context = {
        emitFile: (file: any) => {
          emittedFiles.push(file);
        },
        warn: jest.fn(),
      };

      // Transform some code first to collect styles
      const code = `
        import { css } from '@compiled/react';
        export const Component = () => <div css={css({ margin: '10px' })}>Test</div>;
      `;
      await plugin.transform!(code, 'test.tsx');

      // Call generateBundle
      await plugin.generateBundle.call(context, {}, {});

      // Check that CSS file was emitted
      expect(emittedFiles.length).toBe(1);
      expect(emittedFiles[0]).toMatchObject({
        type: 'asset',
        fileName: 'compiled.css',
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
  });
});
