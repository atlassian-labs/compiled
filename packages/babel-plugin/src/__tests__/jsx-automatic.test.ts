import { transform as transformCode } from '../test-utils';

describe('jsx automatic', () => {
  const transform: typeof transformCode = (code, options) =>
    transformCode(code, { ...options, importReact: false });

  it('should work with css prop and a custom import source', () => {
    const actual = transform(
      `
      import { cssMap } from '@af/compiled';
      const styles = cssMap({ root: { color: 'blue' } });

      <div css={styles.root} />
    `,
      { importSources: ['@af/compiled'] }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
      const _ = "._syaz13q2{color:blue}";
      const styles = {
        root: "_syaz13q2",
      };
      _jsxs(CC, {
        children: [
          _jsx(CS, {
            children: [_],
          }),
          _jsx("div", {
            className: ax([styles.root]),
          }),
        ],
      });
      "
    `);
  });

  it('should work with css prop', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ color: 'blue' }} />
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
      const _ = "._syaz13q2{color:blue}";
      _jsxs(CC, {
        children: [
          _jsx(CS, {
            children: [_],
          }),
          _jsx("div", {
            className: ax(["_syaz13q2"]),
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
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
      const _ = "._syaz13q2{color:blue}";
      _jsxs(CC, {
        children: [
          _jsx(CS, {
            children: [_],
          }),
          _jsx("div", {
            className: ax(["_syaz13q2"]),
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
      "import { forwardRef } from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
      const _ = "._syaz13q2{color:blue}";
      forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
        if (__cmplp.innerRef) {
          throw new Error("Please use 'ref' instead of 'innerRef'.");
        }
        return _jsxs(CC, {
          children: [
            _jsx(CS, {
              children: [_],
            }),
            _jsx(C, {
              ...__cmplp,
              style: __cmpls,
              ref: __cmplr,
              className: ax(["_syaz13q2", __cmplp.className]),
            }),
          ],
        });
      });
      "
    `);
  });
});
