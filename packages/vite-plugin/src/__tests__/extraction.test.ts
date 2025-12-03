import fs from 'fs';
import os from 'os';
import path from 'path';

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
        name: 'compiled.css',
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

  describe('load hook - distributed CSS', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should have a load hook', () => {
      const plugin = compiledVitePlugin({ extract: true });

      expect(plugin.load).toBeDefined();
      expect(typeof plugin.load).toBe('function');
    });

    it('should intercept .compiled.css imports and return empty module', () => {
      const plugin = compiledVitePlugin({ extract: true });

      const result = plugin.load!('/node_modules/@atlaskit/button/dist/button.compiled.css');

      expect(result).toEqual({
        code: '',
        map: null,
      });
    });

    it('should not intercept non-.compiled.css files', () => {
      const plugin = compiledVitePlugin({ extract: true });

      const result = plugin.load!('/some/file.js');

      expect(result).toBeNull();
    });

    it('should collect CSS from distributed .compiled.css files via load hook', async () => {
      // Create a temporary CSS file to simulate distributed package
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compiled-test-'));
      const cssFilePath = path.join(tmpDir, 'button.compiled.css');
      const distributedCss = '._syaz13q2{color:blue}\n._1wybgktf{padding:8px}';
      fs.writeFileSync(cssFilePath, distributedCss);

      try {
        const plugin = compiledVitePlugin({ extract: true });
        const emittedFiles: any[] = [];

        // Mock context
        const context = {
          emitFile: (file: any) => {
            emittedFiles.push(file);
            return 'mock-ref';
          },
          getFileName: () => 'compiled.css',
          warn: jest.fn(),
        };

        // Simulate loading the distributed CSS file
        // This should collect the CSS rules internally
        plugin.load!(cssFilePath);

        // Also transform some local code
        const code = `
          import { css } from '@compiled/react';
          export const Component = () => <div css={css({ margin: '10px' })}>Test</div>;
        `;
        await plugin.transform!(code, 'test.tsx');

        // Generate bundle
        await plugin.generateBundle.call(context, {}, {});

        // Check that CSS was emitted
        expect(emittedFiles.length).toBe(1);
        const cssContent = emittedFiles[0].source as string;

        // Should contain both distributed styles and local styles
        expect(cssContent).toContain('color:blue'); // from distributed CSS
        expect(cssContent).toContain('padding:8px'); // from distributed CSS
        expect(cssContent).toContain('margin'); // from local code
      } finally {
        // Cleanup temp file
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should handle missing distributed CSS files gracefully', () => {
      const plugin = compiledVitePlugin({ extract: true });

      // Mock fs to simulate missing file
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      // Should not throw
      expect(() => {
        plugin.load!('/node_modules/@atlaskit/button/dist/button.compiled.css');
      }).not.toThrow();

      mockExistsSync.mockRestore();
    });

    it('should handle complete platform extraction flow with package imports', async () => {
      // This test simulates the complete flow:
      // 1. User code imports from a distributed package
      // 2. That package's JS includes a .compiled.css import
      // 3. Our plugin collects both the package's styles and local styles

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compiled-test-'));

      // Simulate @atlaskit/button package structure
      const buttonDir = path.join(tmpDir, 'node_modules', '@atlaskit', 'button', 'dist');
      fs.mkdirSync(buttonDir, { recursive: true });

      // Create the compiled CSS file that would be in the distributed package
      const buttonCssPath = path.join(buttonDir, 'button.compiled.css');
      const buttonCss = '._syaz5scu{color:red}\n._bfhk1if8{background-color:blue}';
      fs.writeFileSync(buttonCssPath, buttonCss);

      // Create a JS file that imports the CSS (simulating extracted package output)
      const buttonJsPath = path.join(buttonDir, 'index.js');
      const buttonJs = `
        import './button.compiled.css';
        export const Button = () => 'Button';
      `;
      fs.writeFileSync(buttonJsPath, buttonJs);

      try {
        const plugin = compiledVitePlugin({ extract: true });
        const emittedFiles: any[] = [];

        const context = {
          emitFile: (file: any) => {
            emittedFiles.push(file);
            return 'mock-ref';
          },
          getFileName: () => 'compiled.css',
          warn: jest.fn(),
        };

        // Step 1: Transform user code that imports the package
        // (In real Vite, this would trigger loading the package's JS)
        const userCode = `
          import { css } from '@compiled/react';
          import { Button } from '@atlaskit/button';
          export const App = () => <div css={css({ fontSize: '14px' })}><Button /></div>;
        `;
        await plugin.transform!(userCode, 'App.tsx');

        // Step 2: Simulate Vite loading the package's JS file
        // The transform hook would skip this (it's in node_modules and doesn't have @compiled/react)
        // but we can verify the behavior
        const packageTransformResult = await plugin.transform!(buttonJs, buttonJsPath);
        // Should return null because it doesn't contain @compiled/react
        expect(packageTransformResult).toBeNull();

        // Step 3: Simulate Vite encountering the .compiled.css import
        // This is where our load hook comes in
        const loadResult = plugin.load!(buttonCssPath);

        // Should intercept and return empty module
        expect(loadResult).toEqual({ code: '', map: null });

        // Step 4: Generate the final bundle
        await plugin.generateBundle.call(context, {}, {});

        // Verify final CSS contains both sources
        expect(emittedFiles.length).toBe(1);
        const finalCss = emittedFiles[0].source as string;

        // From distributed package
        expect(finalCss).toContain('color:red');
        expect(finalCss).toContain('background-color:blue');

        // From local code
        expect(finalCss).toContain('font-size');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
