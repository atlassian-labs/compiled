import { transformResultString } from './swc-output';

describe('swc-plugin snapshots', () => {
  it('css prop basic extraction with selector', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        color: 'red',
        '&:hover': { color: 'blue' },
      });
      <div css={[styles]} />
    `;
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._30l313q2:hover{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu _30l313q2"
          ])
      });
      "
    `);
  });

  it('cssMap basic', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      const variants = cssMap({
        primary: { color: 'red' },
        secondary: { color: 'blue' },
      });
    `;
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._syaz13q2{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const variants = {
          primary: "_syaz5scu",
          secondary: "_syaz13q2"
      };
      "
    `);
  });

  it('css supports const identifier inside object', async () => {
    const code = `
      import { css } from '@compiled/react';
      const myColor = 'red';
      const styles = css({ color: myColor });
      <div css={styles} />
    `;
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const myColor = 'red';
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu"
          ])
      });
      "
    `);
  });

  it('css supports const template literal in value', async () => {
    const code = [
      "import { css } from '@compiled/react';",
      'const size = 10;',
      'const styles = css({ fontSize: `${size}px` });',
      '<div css={styles} />',
    ].join('\n');
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._1wyb19bv{font-size:10px}";
      const size = 10;
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_1wyb19bv"
          ])
      });
      "
    `);
  });

  it('css supports const binary + operator for strings', async () => {
    const code = `
      import { css } from '@compiled/react';
      const cls = 're' + 'd';
      const styles = css({ color: cls });
      <div css={styles} />
    `;
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const cls = 're' + 'd';
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu"
          ])
      });
      "
    `);
  });

  it('css supports const binary + operator for numbers', async () => {
    const code = `
      import { css } from '@compiled/react';
      const a = 5; const b = 5;
      const styles = css({ lineHeight: a + b });
      <div css={styles} />
    `;
    const out = await transformResultString(code);
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._vwz4zo7u{line-height:10}";
      const a = 5;
      const b = 5;
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_vwz4zo7u"
          ])
      });
      "
    `);
  });

  it('css supports complex selectors and !important', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        color: 'red !important',
        '& + label ~ div': { color: 'blue' },
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._1hwd13q2+label~div{color:blue}";
      const _ = "._syaz1qpq{color:red!important}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz1qpq",
              "_1hwd13q2"
          ])
      });
      "
    `);
  });

  // xcss-specific tests moved to xcss.test.js

  it('css prop extract:false wraps with CC/CS and preserves className', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        color: 'red !important',
        '& + label ~ div': { color: 'blue' },
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._1hwd13q2+label~div{color:blue}";
      const _ = "._syaz1qpq{color:red!important}";
      const styles = null;
      /*#__PURE__*/ /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
          _,
          _2
      ]), React.createElement("div", {
          className: ax([
              "_syaz1qpq",
              "_1hwd13q2"
          ])
      }));
      "
    `);
  });

  it('multiple elements extract:false wrap individually', async () => {
    const code = `
      import { css } from '@compiled/react';
      import React from 'react';

      const styles = css({
        color: 'red !important',
        '&:hover': {
          '& + label': { color: 'blue' }
        },
      });

      const Button = () => {
        return (
          <div>
            <div css={styles} />
            <div css={styles} />
          </div>
        )
      }
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._i8hm13q2:hover+label{color:blue}";
      const _ = "._syaz1qpq{color:red!important}";
      import React from 'react';
      const styles = null;
      const Button = ()=>{
          return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_syaz1qpq",
                  "_i8hm13q2"
              ])
          })), /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_syaz1qpq",
                  "_i8hm13q2"
              ])
          })));
      };
      "
    `);
  });

  it('css prop with @media (extract:true)', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        color: 'red',
        '@media screen': {
          color: 'blue',
          fontSize: 16,
        },
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _3 = "@media screen{._1yzyexct{font-size:16px}}";
      const _2 = "@media screen{._434713q2{color:blue}}";
      const _ = "._syaz5scu{color:red}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu",
              "_434713q2",
              "_1yzyexct"
          ])
      });
      "
    `);
  });

  it('cssMap with @media in variants', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      const variants = cssMap({
        primary: {
          '@media screen': { color: 'red' },
        },
        secondary: {
          '@media screen': { fontSize: 16 },
        },
      });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _2 = "@media screen{._1yzyexct{font-size:16px}}";
      const _ = "@media screen{._43475scu{color:red}}";
      const variants = {
          primary: "_43475scu",
          secondary: "_1yzyexct"
      };
      "
    `);
  });

  it('numeric values add px where required and preserve unitless', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        fontSize: 16,
        lineHeight: 2,
        marginTop: 0,
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _3 = "._19pkidpf{margin-top:0}";
      const _2 = "._vwz4cs5v{line-height:2}";
      const _ = "._1wybexct{font-size:16px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_1wybexct",
              "_vwz4cs5v",
              "_19pkidpf"
          ])
      });
      "
    `);
  });

  it('padding shorthand expands to longhands even without explicit longhands', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        padding: '10px 20px',
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _4 = "._19bvgktf{padding-left:20px}";
      const _3 = "._n3td19bv{padding-bottom:10px}";
      const _2 = "._u5f3gktf{padding-right:20px}";
      const _ = "._ca0q19bv{padding-top:10px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_ca0q19bv",
              "_u5f3gktf",
              "_n3td19bv",
              "_19bvgktf"
          ])
      });
      "
    `);
  });

  it('padding shorthand expanded when longhands present', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({
        padding: '10px 20px',
        paddingLeft: '4px',
      });
      <div css={styles} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _5 = "._19bv1y44{padding-left:4px}";
      const _4 = "._19bvgktf{padding-left:20px}";
      const _3 = "._n3td19bv{padding-bottom:10px}";
      const _2 = "._u5f3gktf{padding-right:20px}";
      const _ = "._ca0q19bv{padding-top:10px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_ca0q19bv",
              "_u5f3gktf",
              "_n3td19bv",
              "_19bvgktf",
              "_19bv1y44"
          ])
      });
      "
    `);
  });

  it('styled basic object call (extract:true) without CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Button = styled.div({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_syaz5scu",
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

  it('styled basic object call (extract:false) wraps with CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Button = styled.div({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_syaz5scu",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls
              },
              ref: __cmplr,
              ...__cmplp
          }));
      });
      "
    `);
  });

  it('deduplicates identical styles across multiple elements', async () => {
    const code = `
      import { css } from '@compiled/react';
      const a = css({ color: 'red' });
      const b = css({ color: 'red' });
      <>
        <div css={[a]} />
        <div css={[b]} />
      </>
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const a = null;
      const b = null;
      /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu"
          ])
      }), /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_syaz5scu"
          ])
      }));
      "
    `);
  });
});
