import { transform as transformCode } from '../test-utils';

describe('jsx automatic', () => {
  const transform = (code: string) => transformCode(code, { importReact: false });

  it('should work with css prop', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ color: 'blue' }} />
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";

      _jsxs(CC, {
        children: [
          _jsx(CS, {
            children: [_],
          }),
          _jsx(\\"div\\", {
            className: ax([\\"_syaz13q2\\"]),
          }),
        ],
      });
      "
    `);
  });

  it('should work with class names', () => {
    const actual = transform(`
      import { ClassNames } from '@compiled/react';

      <ClassNames>
        {props => <div className={props.css({ color: 'blue' })} />}
      </ClassNames>
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";

      _jsxs(CC, {
        children: [
          _jsx(CS, {
            children: [_],
          }),
          _jsx(\\"div\\", {
            className: \\"_syaz13q2\\",
          }),
        ],
      });
      "
    `);
  });

  it('should work with styled', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      styled.div\`
        color: blue;
      \`;
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { forwardRef } from \\"react\\";
      import { ax, ix, CC, CS } from \\"@compiled/react/runtime\\";
      import { jsx as _jsx } from \\"react/jsx-runtime\\";
      import { jsxs as _jsxs } from \\"react/jsx-runtime\\";
      const _ = \\"._syaz13q2{color:blue}\\";
      forwardRef(({ as: C = \\"div\\", style, ...props }, ref) => {
        return _jsxs(CC, {
          children: [
            _jsx(CS, {
              children: [_],
            }),
            _jsx(C, {
              ...props,
              style: style,
              ref: ref,
              className: ax([\\"_syaz13q2\\", props.className]),
            }),
          ],
        });
      });
      "
    `);
  });
});
