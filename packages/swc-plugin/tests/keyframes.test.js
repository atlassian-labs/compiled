import { transformResultString } from './swc-output';

describe('keyframes (swc-plugin)', () => {
  it('inlines animation-name for css prop object call expression', async () => {
    const code = `
      import { css, keyframes } from '@compiled/react';

      const fadeOut = keyframes({
        from: { opacity: 1 },
        to: { opacity: 0 },
      });

      <div css={{ animationName: fadeOut }} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._8koknt6j{animation-name:k8xhyq9yh}";
      const _ = "@keyframes k8xhyq9yh{0%{opacity:1}to{opacity:0}}";
      const fadeOut = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_8koknt6j"
          ])
      });
      "
    `);
  });

  it('works inside styled object call expression (shorthand animation)', async () => {
    const code = `
      import { styled, keyframes } from '@compiled/react';
      const fadeOut = keyframes({ from: { opacity: 1 }, to: { opacity: 0 } });
      const C = styled.div({ animation: 
        ("" + (fadeOut) + " 2s ease-in-out")
      });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._a6933olu{animation:k71c0py4z 2s ease-in-out}";
      const _ = "@keyframes k71c0py4z{0%{opacity:1}to{opacity:0}}";
      import { styled, keyframes } from '@compiled/react';
      const fadeOut = null;
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_a6933olu",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });
});
