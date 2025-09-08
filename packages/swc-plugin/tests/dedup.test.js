const { transformResultString } = require('./swc-output');

describe('deduplication (swc-plugin)', () => {
  it('deduplicates identical css() rules across multiple usages', async () => {
    const code = `
      import { css } from '@compiled/react';
      const a = css({ color: 'red' });
      const b = css({ color: 'red' });
      export const C = () => (<><div css={a}></div><div css={b}></div></>);
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._3hisej0k{color:red}";
      const a = null;
      const b = null;
      export const C = ()=>/*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisej0k"
              ])
          }), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisej0k"
              ])
          }));
      "
    `);
  });

  it('deduplicates identical css prop across multiple elements', async () => {
    const code = `
      export const C = () => (
        <>
          <div css={{ color: 'red' }}></div>
          <div css={{ color: 'red' }}></div>
        </>
      );
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._3hisej0k{color:red}";
      export const C = ()=>/*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisej0k"
              ])
          }), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisej0k"
              ])
          }));
      "
    `);
  });
});
