import compiledVitePlugin from '../index';

describe('compiledVitePlugin', () => {
  it('should create a plugin with the correct name', () => {
    const plugin = compiledVitePlugin();

    expect(plugin.name).toBe('@compiled/vite-plugin');
    expect(plugin.enforce).toBe('pre');
  });

  it('should transform code with Compiled imports', async () => {
    const plugin = compiledVitePlugin();
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
      expect(result.code).toContain('_syaz5scu');
      expect(result.code).toContain('color:red');
      expect(result.code).toContain('font-size:9pt'); // 12px gets normalized to 9pt
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
