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
      var _2 = "._1ez813q2:hover{color:blue}";
      var _ = "._9ad05scu{color:red}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_9ad05scu _1ez813q2"
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
      var _2 = "._9ad013q2{color:blue}";
      var _ = "._9ad05scu{color:red}";
      var variants = {
          primary: "_9ad05scu",
          secondary: "_9ad013q2"
      };
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
      var _2 = "._1tv213q2+label~div{color:blue}";
      var _ = "._9ad0191l{color:red!important}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_9ad0191l",
              "_1tv213q2"
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
      var _2 = "._1tv213q2+label~div{color:blue}";
      var _ = "._9ad0191l{color:red!important}";
      var styles = null;
      /*#__PURE__*/ /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
          _,
          _2
      ]), React.createElement("div", {
          className: ax([
              "_9ad0191l",
              "_1tv213q2"
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
      var _2 = "._1z0o13q2:hover+label{color:blue}";
      var _ = "._9ad0191l{color:red!important}";
      import React from "react";
      var styles = null;
      var Button = function() {
          return /*#__PURE__*/ React.createElement("div", null, /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_9ad0191l",
                  "_1z0o13q2"
              ])
          })), /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _,
              _2
          ]), /*#__PURE__*/ React.createElement("div", {
              className: ax([
                  "_9ad0191l",
                  "_1z0o13q2"
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
      var _3 = "@media screen{._1fjmexct{font-size:16px}}";
      var _2 = "@media screen{._iapw13q2{color:blue}}";
      var _ = "._9ad05scu{color:red}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_9ad05scu",
              "_iapw13q2",
              "_1fjmexct"
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
      var _2 = "@media screen{._1fjmexct{font-size:16px}}";
      var _ = "@media screen{._iapw5scu{color:red}}";
      var variants = {
          primary: "_iapw5scu",
          secondary: "_1fjmexct"
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
      var _3 = "._5f6oidpf{margin-top:0}";
      var _2 = "._185qcs5v{line-height:2}";
      var _ = "._1knuexct{font-size:16px}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_1knuexct",
              "_185qcs5v",
              "_5f6oidpf"
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
      var _4 = "._1d4pgktf{padding-left:20px}";
      var _3 = "._udmg19bv{padding-bottom:10px}";
      var _2 = "._1k6rgktf{padding-right:20px}";
      var _ = "._8pk819bv{padding-top:10px}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_8pk819bv",
              "_1k6rgktf",
              "_udmg19bv",
              "_1d4pgktf"
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
      var _5 = "._1d4p1y44{padding-left:4px}";
      var _4 = "._1d4pgktf{padding-left:20px}";
      var _3 = "._udmg19bv{padding-bottom:10px}";
      var _2 = "._1k6rgktf{padding-right:20px}";
      var _ = "._8pk819bv{padding-top:10px}";
      var styles = null;
      /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_8pk819bv",
              "_1k6rgktf",
              "_udmg19bv",
              "_1d4pgktf",
              "_1d4p1y44"
          ])
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
      var _ = "._9ad05scu{color:red}";
      var a = null;
      var b = null;
      /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_9ad05scu"
          ])
      }), /*#__PURE__*/ React.createElement("div", {
          className: ax([
              "_9ad05scu"
          ])
      }));
      "
    `);
  });
});
