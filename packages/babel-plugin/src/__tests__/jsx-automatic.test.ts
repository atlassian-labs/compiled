import { transformSync } from '@babel/core';

import babelPlugin from '../index';

const transform = (code: TemplateStringsArray) => {
  return transformSync(code[0], {
    configFile: false,
    babelrc: false,
    filename: 'jsx-automatic.test.tsx',
    presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    plugins: [[babelPlugin, { importReact: false }]],
  })?.code;
};

describe('jsx automatic', () => {
  it('should work with css prop', () => {
    const actual = transform`
      import '@compiled/react';

      <div css={{ color: 'blue' }} />
    `;

    expect(actual).toMatchInlineSnapshot(`
      "/* jsx-automatic.test.tsx generated by @compiled/babel-plugin v0.0.0 */

      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";

      /*#__PURE__*/
      _jsxs(CC, {
        children: [/*#__PURE__*/_jsx(CS, {
          children: [_]
        }), /*#__PURE__*/_jsx(\\"div\\", {
          className: ax([\\"_syaz13q2\\"])
        })]
      });"
    `);
  });

  it('should work with class names', () => {
    const actual = transform`
      import { ClassNames } from '@compiled/react';

      <ClassNames>
        {props => <div className={props.css({ color: 'blue' })} />}
      </ClassNames>
    `;

    expect(actual).toMatchInlineSnapshot(`
      "/* jsx-automatic.test.tsx generated by @compiled/babel-plugin v0.0.0 */

      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";

      /*#__PURE__*/
      _jsxs(CC, {
        children: [/*#__PURE__*/_jsx(CS, {
          children: [_]
        }), /*#__PURE__*/_jsx(\\"div\\", {
          className: \\"_syaz13q2\\"
        })]
      });"
    `);
  });

  it('should work with styled', () => {
    const actual = transform`
      import { styled } from '@compiled/react';

      styled.div\`
        color: blue;
      \`;
    `;

    expect(actual).toMatchInlineSnapshot(`
      "/* jsx-automatic.test.tsx generated by @compiled/babel-plugin v0.0.0 */

      import { forwardRef } from 'react';
      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";
      forwardRef(({
        as: C = \\"div\\",
        style,
        ...props
      }, ref) => /*#__PURE__*/_jsxs(CC, {
        children: [/*#__PURE__*/_jsx(CS, {
          children: [_]
        }), /*#__PURE__*/_jsx(C, { ...props,
          style: style,
          ref: ref,
          className: ax([\\"_syaz13q2\\", props.className])
        })]
      }));"
    `);
  });
});