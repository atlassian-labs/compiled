const { transformResultString } = require('./swc-output');

describe('swc-plugin2 snapshots', () => {
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
      const _2 = "._3op32scz:hover{color:blue}";
      const _ = "._3hisej0k{color:red}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_3hisej0k _3op32scz"
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
      const _2 = "._3his2scz{color:blue}";
      const _ = "._3hisej0k{color:red}";
      const variants = {
          primary: "_3hisej0k",
          secondary: "_3his2scz"
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
      const _ = "._3hisej0k{color:red}";
      const myColor = 'red';
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_3hisej0k"
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
      const _ = "._7ql1bjn1{font-size:10px}";
      const size = 10;
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_7ql1bjn1"
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
      const _ = "._3hisej0k{color:red}";
      const cls = 're' + 'd';
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_3hisej0k"
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
      const _ = "._6hxr5nrs{line-height:10}";
      const a = 5;
      const b = 5;
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_6hxr5nrs"
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
      const _2 = "._9rxa2scz+label~div{color:blue}";
      const _ = "._3hisatgm{color:red!important}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_3hisatgm",
              "_9rxa2scz"
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
      const _2 = "._9rxa2scz+label~div{color:blue}";
      const _ = "._3hisatgm{color:red!important}";
      const styles = null;
      /*#__PURE__*/ /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
          _,
          _2
      ]), React.createElement("div", {
          className: ax([
              "_3hisatgm",
              "_9rxa2scz"
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
      const _2 = "._e1q32scz:hover+label{color:blue}";
      const _ = "._3hisatgm{color:red!important}";
      import React from 'react';
      const styles = null;
      const Button = ()=>{
          return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisatgm",
                  "_e1q32scz"
              ])
          })), /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_3hisatgm",
                  "_e1q32scz"
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
      const _3 = "@media screen{._93hc8jm4{font-size:16px}}";
      const _2 = "@media screen{._aooa2scz{color:blue}}";
      const _ = "._3hisej0k{color:red}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_3hisej0k",
              "_aooa2scz",
              "_93hc8jm4"
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
      const _2 = "@media screen{._93hc8jm4{font-size:16px}}";
      const _ = "@media screen{._aooaej0k{color:red}}";
      const variants = {
          primary: "_aooaej0k",
          secondary: "_93hc8jm4"
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
      const _3 = "._5mpx4k5u{margin-top:0}";
      const _2 = "._6hxr7ngg{line-height:2}";
      const _ = "._7ql18jm4{font-size:16px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_7ql18jm4",
              "_6hxr7ngg",
              "_5mpx4k5u"
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
      const _4 = "._7wlm154n{padding-left:20px}";
      const _3 = "._da1ibjn1{padding-bottom:10px}";
      const _2 = "._vhdx154n{padding-right:20px}";
      const _ = "._8edybjn1{padding-top:10px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_8edybjn1",
              "_vhdx154n",
              "_da1ibjn1",
              "_7wlm154n"
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
      const _5 = "._7wlm9z5l{padding-left:4px}";
      const _4 = "._7wlm154n{padding-left:20px}";
      const _3 = "._da1ibjn1{padding-bottom:10px}";
      const _2 = "._vhdx154n{padding-right:20px}";
      const _ = "._8edybjn1{padding-top:10px}";
      const styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_8edybjn1",
              "_vhdx154n",
              "_da1ibjn1",
              "_7wlm154n",
              "_7wlm9z5l"
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
      const _ = "._3hisej0k{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_3hisej0k",
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
      const _ = "._3hisej0k{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_3hisej0k",
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
      const _ = "._3hisej0k{color:red}";
      const a = null;
      const b = null;
      /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
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
