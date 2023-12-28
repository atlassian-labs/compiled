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

describe('TODO', () => {
  it('TODO', () => {
    throw new Error('These snapshot tests are too vague - change these to be more specific in what they are testing');
  });
});

describe('should work with classic runtime + jsx pragma', () => {
  it('works with classic runtime + jsx pragma', () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
      run: 'both',
      runtime: 'classic',
    });

    expect(actual).toMatchInlineSnapshot(`
      "/* app.tsx generated by @compiled/babel-plugin v0.0.0 */
      import * as React from 'react';
      import { ax, ix } from '@compiled/react/runtime';
      const Component = () =>
        /*#__PURE__*/ React.createElement(
          'div',
          {
            className: ax(['_1wyb1fwx _syaz13q2']),
          },
          'hello world 2'
        );
      const Component2 = () =>
        /*#__PURE__*/ React.createElement(
          'div',
          {
            className: ax(['_1wyb1fwx _syaz32ev']),
          },
          'hello world 2'
        );
      "
    `);
  });

  it('works with classic runtime + jsx pragma (custom import)', () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
      run: 'both',
      runtime: 'classic',
    });

    expect(actual).toMatchInlineSnapshot(`
      "/* app.tsx generated by @compiled/babel-plugin v0.0.0 */
      import * as React from 'react';
      import { ax, ix } from '@compiled/react/runtime';
      const Component = () =>
        /*#__PURE__*/ React.createElement(
          'div',
          {
            className: ax(['_1wyb1fwx _syaz13q2']),
          },
          'hello world 2'
        );
      const Component2 = () =>
        /*#__PURE__*/ React.createElement(
          'div',
          {
            className: ax(['_1wyb1fwx _syaz32ev']),
          },
          'hello world 2'
        );
      "
    `);
  });

  it('throws if runtime is classic, and pragma is set in babel config', () => {
    const codeWithPragma = `
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

    expect(() =>
      transform(codeWithPragma, {
        run: 'both',
        runtime: 'classic',
        babelJSXPragma: 'jsx',
      })
    ).toThrow();
  });

  it('throws if runtime is classic, and pragma is set in babel config (custom import)', () => {
    const codeWithPragma = `
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

    expect(() =>
      transform(codeWithPragma, {
        run: 'both',
        runtime: 'classic',
        babelJSXPragma: 'myJsx',
      })
    ).toThrow();
  });

  it("doesn't do anything to emotion's jsx pragma with classic runtime", () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
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

  it("doesn't do anything to emotion's jsx pragma with classic runtime (custom import)", () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
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

  it("errors when emotion's classic runtime jsx pragma is mixed with compiled", () => {
    const codeWithPragma = `
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
      transform(codeWithPragma, {
        run: 'both',
        runtime: 'classic',
      })
    ).toThrow();
  });
});

describe('should work with automatic runtime + jsx pragma', () => {
  it('works with automatic runtime + jsx pragma', () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
      run: 'both',
      runtime: 'automatic',
    });

    expect(actual).toMatchInlineSnapshot(`
      "/* app.tsx generated by @compiled/babel-plugin v0.0.0 */
      import { ax, ix } from '@compiled/react/runtime';
      import { jsxs as _jsxs } from 'react/jsx-runtime';
      import { jsx as _jsx } from 'react/jsx-runtime';
      const Component = () =>
        /*#__PURE__*/ _jsx('div', {
          className: ax(['_1wyb1fwx _syaz13q2']),
          children: 'hello world 2',
        });
      const Component2 = () =>
        /*#__PURE__*/ _jsx('div', {
          className: ax(['_1wyb1fwx _syaz32ev']),
          children: 'hello world 2',
        });
      "
    `);
  });

  it("doesn't do anything to emotion's jsx pragma with automatic runtime", () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
      run: 'both',
      runtime: 'automatic',
    });

    expect(actual).toMatchInlineSnapshot(`
      "/** @jsxImportSource @emotion/react */
      import { css } from '@emotion/react';
      import { jsx as _jsx } from '@emotion/react/jsx-runtime';
      const Component = () =>
        _jsx('div', {
          css: {
            fontSize: 12,
            color: 'blue',
          },
          children: 'hello world 2',
        });
      const Component2 = () =>
        _jsx('div', {
          css: css({
            fontSize: 12,
            color: 'pink',
          }),
          children: 'hello world 2',
        });
      "
    `);
  });

  it('works fine if runtime is automatic, and pragma is set in babel config', () => {
    const codeWithPragma = `
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

    const actual = transform(codeWithPragma, {
      run: 'both',
      runtime: 'automatic',
      babelJSXImportSource: '@compiled/react',
    });

    expect(actual).toMatchInlineSnapshot(`
      "/* app.tsx generated by @compiled/babel-plugin v0.0.0 */
      import { ax, ix } from '@compiled/react/runtime';
      import { jsxs as _jsxs } from '@compiled/react/jsx-runtime';
      import { jsx as _jsx } from '@compiled/react/jsx-runtime';
      const Component = () =>
        _jsx('div', {
          className: ax(['_1wyb1fwx _syaz13q2']),
          children: 'hello world 2',
        });
      const Component2 = () =>
        _jsx('div', {
          className: ax(['_1wyb1fwx _syaz32ev']),
          children: 'hello world 2',
        });
      "
    `);
  });
});