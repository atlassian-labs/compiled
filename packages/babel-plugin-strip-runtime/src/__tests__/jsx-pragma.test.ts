import { transform } from './transform';

// These tests cover both functionality from
// @compiled/babel-plugin and @compiled/babel-plugin-strip-runtime
// and how they interact with:
//
// * JSX pragma comments /** @jsx jsx */ and
//     /** @jsxImportSource @compiled/react */, and
// * @babel/preset-react's JSX pragma-related config options
//     (discussed in
//     https://babeljs.io/docs/babel-plugin-transform-react-jsx
//     and https://babeljs.io/docs/babel-preset-react)

describe('Compiled setup with classic runtime', () => {
  describe('with JSX pragma', () => {
    describe('if only Compiled is used in file', () => {
      it('converts JSX elements to React.createElement', () => {
        const code = `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';

        const Component = () => (
          <div css={{ fontSize: 12, color: 'blue' }}>
            hello world 2
          </div>
        );

        const Component2 = () => (
          <div css={css({ fontSize: 12, color: 'pink' })}>
            hello world 2
          </div>
        );
      `;

        const codeWithRenamedImport = `
        /** @jsx myJsx */
        import { css, jsx as myJsx } from '@compiled/react';

        const Component = () => (
          <div css={{ fontSize: 12, color: 'blue' }}>
            hello world 2
          </div>
        );

        const Component2 = () => (
          <div css={css({ fontSize: 12, color: 'pink' })}>
            hello world 2
          </div>
        );
      `;

        for (const c of [code, codeWithRenamedImport]) {
          const actual = transform(c, {
            run: 'both',
            runtime: 'classic',
          });

          expect(actual).toContain("import * as React from 'react';");
          // All components should look like this:
          //     const Component = () => /*#__PURE__*/ React.createElement(...)
          expect(actual).toMatch(
            /Component = \(\) =>\n(\s)*\/\*#__PURE__\*\/ React.createElement/m
          );
          expect(actual).toMatch(
            /Component2 = \(\) =>\n(\s)*\/\*#__PURE__\*\/ React.createElement/m
          );
          // All traces of JSX pragma or JSX imports are removed
          expect(actual).not.toContain('jsx');
        }
      });
    });

    describe('if only Emotion is used in file', () => {
      it('is not processed by Compiled', () => {
        const code = `
          /** @jsx jsx */
          import { css, jsx } from '@emotion/react';

          const Component = () => (
            <div css={{ fontSize: 12, color: 'blue' }}>
              hello world 2
            </div>
          );

          const Component2 = () => (
            <div css={css({ fontSize: 12, color: 'pink' })}>
              hello world 2
            </div>
          );
        `;

        const actual = transform(code, {
          run: 'both',
          runtime: 'classic',
        });

        expect(actual).toMatchInlineSnapshot(`
          "/** @jsx jsx */
          import { css, jsx } from '@emotion/react';
          const Component = () =>
            jsx(
              'div',
              {
                css: {
                  fontSize: 12,
                  color: 'blue',
                },
              },
              'hello world 2'
            );
          const Component2 = () =>
            jsx(
              'div',
              {
                css: css({
                  fontSize: 12,
                  color: 'pink',
                }),
              },
              'hello world 2'
            );
          "
        `);
      });

      it('is not processed by Compiled (with renamed JSX pragma)', () => {
        // Uses renamed import `myJsx`
        const code = `
          /** @jsx myJsx */
          import { css, jsx as myJsx } from '@emotion/react';

          const Component = () => (
            <div css={{ fontSize: 12, color: 'blue' }}>
              hello world 2
            </div>
          );

          const Component2 = () => (
            <div css={css({ fontSize: 12, color: 'pink' })}>
              hello world 2
            </div>
          );
        `;

        const actual = transform(code, {
          run: 'both',
          runtime: 'classic',
        });

        expect(actual).toMatchInlineSnapshot(`
          "/** @jsx myJsx */
          import { css, jsx as myJsx } from '@emotion/react';
          const Component = () =>
            myJsx(
              'div',
              {
                css: {
                  fontSize: 12,
                  color: 'blue',
                },
              },
              'hello world 2'
            );
          const Component2 = () =>
            myJsx(
              'div',
              {
                css: css({
                  fontSize: 12,
                  color: 'pink',
                }),
              },
              'hello world 2'
            );
          "
        `);
      });
    });

    describe('if both Compiled and Emotion are used in file', () => {
      it('throws error', () => {
        const code = `
          /** @jsx jsx */
          import { css } from '@compiled/react';
          import { jsx } from '@emotion/react';

          const Component = () => (
            <div css={{ fontSize: 12, color: 'blue' }}>
              hello world 2
            </div>
          );

          const Component2 = () => (
            <div css={css({ fontSize: 12, color: 'pink' })}>
              hello world 2
            </div>
          );
        `;

        expect(() =>
          transform(code, {
            run: 'both',
            runtime: 'classic',
          })
        ).toThrow(/Found a `jsx` function call/);
      });
    });
  });

  describe('without JSX pragma', () => {
    it('throws error if pragma is set in babel config', () => {
      const code = `
        /** @jsx jsx */
        import { css, jsx } from '@compiled/react';

        const Component = () => (
          <div css={{ fontSize: 12, color: 'blue' }}>
            hello world 2
          </div>
        );

        const Component2 = () => (
          <div css={css({ fontSize: 12, color: 'pink' })}>
            hello world 2
          </div>
        );
      `;

      const codeWithRenamedImport = `
        /** @jsx myJsx */
        import { css, jsx as myJsx } from '@compiled/react';

        const Component = () => (
          <div css={{ fontSize: 12, color: 'blue' }}>
            hello world 2
          </div>
        );

        const Component2 = () => (
          <div css={css({ fontSize: 12, color: 'pink' })}>
            hello world 2
          </div>
        );
      `;

      for (const c of [code, codeWithRenamedImport]) {
        expect(() =>
          transform(c, {
            run: 'both',
            runtime: 'classic',
            babelJSXPragma: 'jsx',
          })
        ).toThrow(/Found a `jsx` function call/);
      }
    });
  });
});

describe('Compiled setup with automatic runtime', () => {
  describe('with JSX pragma', () => {
    describe('if Compiled is used in file', () => {
      it('imports JSX runtime from React, not Compiled', () => {
        const code = `
          /** @jsxImportSource @compiled/react */
          import { css } from '@compiled/react';

          const Component = () => (
            <div css={{ fontSize: 12, color: 'blue' }}>
              hello world 2
            </div>
          );

          const Component2 = () => (
            <div css={css({ fontSize: 12, color: 'pink' })}>
              hello world 2
            </div>
          );
        `;

        const actual = transform(code, {
          run: 'both',
          runtime: 'automatic',
        });

        expect(actual).toContain("'react/jsx-runtime'");
        expect(actual).not.toContain("'@compiled/react/jsx-runtime'");

        // jsx function calls from React (and not from Compiled/Emotion/etc)
        // have "PURE" comments added beforehand by @babel/preset-react.
        // Make sure this is there so Webpack or Parcel can use tree-shaking.
        expect(actual).toContain('/*#__PURE__*/ _jsx');
      });
    });

    describe('if Emotion is used in file', () => {
      it('does not process file', () => {
        const code = `
          /** @jsxImportSource @emotion/react */
          import { css } from '@emotion/react';

          const Component = () => (
            <div css={{ fontSize: 12, color: 'blue' }}>
              hello world 2
            </div>
          );

          const Component2 = () => (
            <div css={css({ fontSize: 12, color: 'pink' })}>
              hello world 2
            </div>
          );
        `;

        const actual = transform(code, {
          run: 'both',
          runtime: 'automatic',
        });

        expect(actual).toContain("'@emotion/react/jsx-runtime'");

        expect(actual).not.toContain("'@compiled/react/jsx-runtime'");

        // If any of the below statements are present, that means we accidentally
        // got rid of the /** @jsxImportSource @emotion/react */ and the default React
        // JSX runtime is being used instead of Emotion -- whoops!
        expect(actual).not.toContain("'react/jsx-runtime'");
        expect(actual).not.toContain('/*#__PURE__*/ _jsx');
      });
    });
  });

  describe('without JSX pragma', () => {
    it('imports JSX from Compiled if pragma is set in babel config', () => {
      const code = `
        import { css, jsx } from '@compiled/react';

        const Component = () => (
          <div css={{ fontSize: 12, color: 'blue' }}>
            hello world 2
          </div>
        );

        const Component2 = () => (
          <div css={css({ fontSize: 12, color: 'pink' })}>
            hello world 2
          </div>
        );
      `;

      const actual = transform(code, {
        run: 'both',
        runtime: 'automatic',
        babelJSXImportSource: '@compiled/react',
      });

      expect(actual).toContain("'@compiled/react/jsx-runtime'");
      expect(actual).not.toContain("'react/jsx-runtime'");
    });
  });
});
