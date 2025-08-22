const { transformResultString } = require('./swc-output');

describe('styled (swc-plugin2)', () => {
  it('only transforms @compiled/react usages', async () => {
    const code = `
      import { styled as styled2 } from '@compiled/react';
      import styled from 'styled-components';

      const A = styled.div({ color: 'blue' });
      const B = styled2.div({ color: 'blue' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad013q2{color:blue}";
      import { styled as styled2 } from '@compiled/react';
      import styled from 'styled-components';
      const A = styled.div({
          color: 'blue'
      });
      const B = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad013q2",
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

  it('respects content property with empty string', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ content: '' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._1ss80{content:}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_1ss80",
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

  it('respects content property with pseudo element (double quotes)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ ':after': { content: '""' } });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = '._97r4b3bt:after{content:""}';
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_97r4b3bt",
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

  it('respects content property with pseudo element (single quotes)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ ':after': { content: "''" } });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._97r41yyf:after{content:''}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_97r41yyf",
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

  it('respects content property with unicode', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ ':after': { content: '😎' } });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._97r417a2:after{content:😎}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_97r417a2",
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
  it('basic object call expression (extract:true) generates sheet and className without CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Button = styled.div({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('basic object call expression (extract:false) wraps with CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Button = styled.div({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const Button = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('supports nested selectors like &:hover and complex selectors', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({
        color: 'red',
        '&:hover': { color: 'blue' },
        '& + label ~ div': { color: 'green' },
      });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _3 = "._1ez813q2:hover{color:blue}";
      const _2 = "._1tv2bf54+label~div{color:green}";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
                  "_1tv2bf54",
                  "_1ez813q2",
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

  it('adds px for numeric values where appropriate and keeps unitless where required', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({
        fontSize: 16,
        lineHeight: 2,
        marginTop: 0,
      });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _3 = "._5f6oidpf{margin-top:0}";
      const _2 = "._185qcs5v{line-height:2}";
      const _ = "._1knuexct{font-size:16px}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_1knuexct",
                  "_185qcs5v",
                  "_5f6oidpf",
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

  it('expands padding shorthand into longhands', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ padding: '10px 20px' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _4 = "._1d4pgktf{padding-left:20px}";
      const _3 = "._udmg19bv{padding-bottom:10px}";
      const _2 = "._1k6rgktf{padding-right:20px}";
      const _ = "._8pk819bv{padding-top:10px}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_8pk819bv",
                  "_1k6rgktf",
                  "_udmg19bv",
                  "_1d4pgktf",
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

  it('supports @media queries in object (extract:true)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({
        color: 'red',
        '@media screen': { color: 'blue', fontSize: 16 },
      });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _3 = "@media screen{._1fjmexct{font-size:16px}}";
      const _2 = "@media screen{._iapw13q2{color:blue}}";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
                  "_iapw13q2",
                  "_1fjmexct",
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

  it('supports styled("div") syntax (extract:true)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled('div')({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('supports styled(Component) syntax (extract:true)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Base = (props) => <span {...props}/>;
      const C = styled(Base)({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const Base = (props)=>/*#__PURE__*/ React.createElement("span", props);
      const C = /*#__PURE__*/ forwardRef(({ as: C = Base, style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('supports styled("div") syntax (extract:false) with CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled('div')({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('supports styled(Component) syntax (extract:false) with CC/CS', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const Base = (props) => <span {...props}/>;
      const C = styled(Base)({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const Base = (props)=>/*#__PURE__*/ React.createElement("span", props);
      const C = /*#__PURE__*/ forwardRef(({ as: C = Base, style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  it('deduplicates identical styles across multiple styled components', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const A = styled.div({ color: 'red' });
      const B = styled.div({ color: 'red' });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      import { styled } from '@compiled/react';
      const A = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      const B = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad05scu",
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

  // The following tests are ported from the babel-plugin styled suite and represent
  // intended behavior once runtime function support is implemented for styled.
  // They are marked as skipped until the SWC plugin matches this behavior.

  it('supports function value from props (color)', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ color: props => props.color });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad0chuz{color:var(--_v1)}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { color: __cmplx, ...__cmpldp } = __cmplp;
          this = this;
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad0chuz",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls,
                  "--_v1": ix(((props)=>props.color)(__cmplp), "px")
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });

  it('supports const variable values inside styled object', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const primary = 'red';
      const C = styled.div({ color: primary });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from \"react\";
      import { ax, ix } from \"@compiled/react/runtime\";
      const _ = \"._9ad05scu{color:red}\";
      import { styled } from '@compiled/react';
      const primary = 'red';
      const C = /*#__PURE__*/ forwardRef(({ as: C = \"div\", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error(\"Please use 'ref' instead of 'innerRef'.\");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  \"_9ad05scu\",
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

  it('throws on mutable let variable used in styled object', async () => {
    const code = `
      import { styled } from '@compiled/react';
      let color = 'red';
      const C = styled.div({ color });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toContain('failed to invoke plugin');
  });

  it('supports arrow function body (IIFE) for value', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ color: props => { return props.color; } });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad0chuz{color:var(--_v1)}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad0chuz",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls,
                  "--_v1": ix(((props)=>{
                      return props.color;
                  })(__cmplp), "px")
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });

  it('applies conditional CSS with ternary operator', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.button({ color: props => (props.isPrimary ? 'blue' : 'red') });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad0chuz{color:var(--_v1)}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "button", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_9ad0chuz",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls,
                  "--_v1": ix(((props)=>props.isPrimary ? 'blue' : 'red')(__cmplp), "px")
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });

  it('moves suffix to inline style for dynamic numeric value', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ fontSize: props => props.size });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._1knuchuz{font-size:var(--_v1)}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_1knuchuz",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls,
                  "--_v1": ix(((props)=>props.size)(__cmplp), "px")
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });

  it('supports functions within nested selectors', async () => {
    const code = `
      import { styled } from '@compiled/react';
      const C = styled.div({ ':hover': { border: ({ isHover }) => isHover ? '1px solid white' : '2px solid black' } });
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { forwardRef } from "react";
      import { ax, ix } from "@compiled/react/runtime";
      const _ = "._f3lychuz:hover{border:var(--_v1)}";
      import { styled } from '@compiled/react';
      const C = /*#__PURE__*/ forwardRef(({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr)=>{
          if (__cmplp.innerRef) {
              throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { isHover: __cmplx, ...__cmpldp } = __cmplp;
          this = this;
          return /*#__PURE__*/ React.createElement(C, {
              className: ax([
                  "_f3lychuz",
                  __cmplp.className
              ]),
              style: {
                  ...__cmpls,
                  "--_v1": ix((({ isHover })=>isHover ? '1px solid white' : '2px solid black')(__cmplp), "px")
              },
              ref: __cmplr,
              ...__cmplp
          });
      });
      "
    `);
  });

  it.skip('tagged template styled usage throws (unsupported)', async () => {
    const code =
      `
      import { styled } from '@compiled/react';
      const C = styled.div` +
      '`' +
      `color: blue;` +
      '`' +
      `;
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot();
  });
});
