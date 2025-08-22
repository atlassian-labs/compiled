const { transformResultString } = require('./swc-output');

describe('xcss prop (swc-plugin2)', () => {
  it('transforms static inline object (extract:true)', async () => {
    const code = `
      <Component xcss={{ color: 'red' }} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "/*#__PURE__*/ import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      React.createElement(Component, {
          xcss: "_9ad05scu"
      });
      "
    `);
  });

  it('throws when inline object is not static', async () => {
    const code = `
      import { bar } from './foo';
      <Component xcss={{ color: bar }} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toContain('failed to invoke plugin');
  });

  it('transforms named xcss prop usage (extract:true)', async () => {
    const code = `
      <Component innerXcss={{ color: 'red' }} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "/*#__PURE__*/ import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      React.createElement(Component, {
          innerXcss: "_9ad05scu"
      });
      "
    `);
  });

  it('works with cssMap (extract:true)', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      const styles = cssMap({ primary: { color: 'red' } });
      <Component xcss={styles.primary} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      const styles = {
          primary: "_9ad05scu"
      };
      /*#__PURE__*/ React.createElement(Component, {
          xcss: styles.primary
      });
      "
    `);
  });

  it('supports ternary with cssMap (extract:false)', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      const styles = cssMap({ primary: { color: 'red' }, secondary: { color: 'blue' } });
      <Component xcss={isPrimary ? styles.primary : styles.secondary} />
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._9ad013q2{color:blue}";
      const _ = "._9ad05scu{color:red}";
      const styles = {
          primary: "_9ad05scu",
          secondary: "_9ad013q2"
      };
      /*#__PURE__*/ /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
          _,
          _2
      ]), React.createElement(Component, {
          xcss: isPrimary ? styles.primary : styles.secondary
      }));
      "
    `);
  });

  it('supports concatenation with j() (extract:false)', async () => {
    const code = `
      import { cssMap, j } from '@compiled/react';
      const styles = cssMap({ primary: { color: 'red' }, secondary: { color: 'blue' } });
      <Component xcss={j(isPrimary && styles.primary, !isPrimary && styles.secondary)} />
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._9ad013q2{color:blue}";
      const _ = "._9ad05scu{color:red}";
      import { cssMap, j } from '@compiled/react';
      const styles = {
          primary: "_9ad05scu",
          secondary: "_9ad013q2"
      };
      /*#__PURE__*/ React.createElement(Component, {
          xcss: j(isPrimary && styles.primary, !isPrimary && styles.secondary)
      });
      "
    `);
  });

  it('transforms when compiled is in scope (extract:true)', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      const styles = cssMap({ primary: { color: 'red' } });
      <Component xcss={styles.primary} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad05scu{color:red}";
      const styles = {
          primary: "_9ad05scu"
      };
      /*#__PURE__*/ React.createElement(Component, {
          xcss: styles.primary
      });
      "
    `);
  });

  it('does not blow up transforming an empty xcss object', async () => {
    const code = `
      <Component xcss={{}} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "/*#__PURE__*/ React.createElement(Component, {
          xcss: undefined
      });
      "
    `);
  });

  it('ignores primitive components using runtime xcss()', async () => {
    const code = `
      import { Box, xcss } from '@atlaskit/primitives';
      <Box xcss={xcss({ color: 'red' })} />
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "import { Box, xcss } from '@atlaskit/primitives';
      /*#__PURE__*/ React.createElement(Box, {
          xcss: xcss({
              color: 'red'
          })
      });
      "
    `);
  });

  it('only adds styles to xcss call sites that use them (extract:false)', async () => {
    const code = `
      import { cssMap } from '@compiled/react';
      import Button from '@atlaskit/button';
      const stylesOne = cssMap({ text: { color: 'red' } })
      const stylesTwo = cssMap({ text: { color: 'blue' } })
      export function Mixed() {
        return (
          <>
            <Button xcss={stylesOne.text} />
            <Button xcss={stylesTwo.text} />
          </>
        );
      }
    `;
    const out = await transformResultString(code, { extract: false });
    expect(out).toMatchInlineSnapshot(`
      "import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._9ad013q2{color:blue}";
      const _ = "._9ad05scu{color:red}";
      import Button from '@atlaskit/button';
      const stylesOne = {
          text: "_9ad05scu"
      };
      const stylesTwo = {
          text: "_9ad013q2"
      };
      export function Mixed() {
          return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _
          ]), /*#__PURE__*/ React.createElement(Button, {
              xcss: stylesOne.text
          })), /*#__PURE__*/ React.createElement(CC, null, /*#__PURE__*/ React.createElement(CS, null, [
              _2
          ]), /*#__PURE__*/ React.createElement(Button, {
              xcss: stylesTwo.text
          })));
      }
      "
    `);
  });

  it('skips importing Compiled runtime when no direct Compiled usage found', async () => {
    const code = `
      /** @jsx jsx */
      import { css, jsx } from '@emotion/react';
      import { Box, xcss } from '@atlaskit/primitives';
      import Button from '@atlaskit/button';
      export function Mixed() {
        return (
          <>
            <Box xcss={xcss({ color: 'red' })} />
            <div css={{ color: 'pink' }} />
          </>
        );
      }
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "/** @jsx jsx */ import { ax, ix } from "@compiled/react/runtime";
      const _ = "._9ad032ev{color:pink}";
      import { jsx } from '@emotion/react';
      import { Box, xcss } from '@atlaskit/primitives';
      export function Mixed() {
          return /*#__PURE__*/ jsx(React.Fragment, null, /*#__PURE__*/ jsx(Box, {
              xcss: xcss({
                  color: 'red'
              })
          }), /*#__PURE__*/ jsx("div", {
              className: ax([
                  "_9ad032ev"
              ])
          }));
      }
      "
    `);
  });

  it('imports Compiled runtime when inline object is used in xcss', async () => {
    const code = `
      /** @jsx jsx */
      import { css, jsx } from '@emotion/react';
      import { Box } from '@atlaskit/primitives';
      export function Mixed() {
        return (
          <>
            <Box xcss={{ color: 'red' }} />
            <div css={{ color: 'pink' }} />
          </>
        );
      }
    `;
    const out = await transformResultString(code, { extract: true });
    expect(out).toMatchInlineSnapshot(`
      "/** @jsx jsx */ import { ax, ix } from "@compiled/react/runtime";
      const _2 = "._9ad032ev{color:pink}";
      const _ = "._9ad05scu{color:red}";
      import { jsx } from '@emotion/react';
      import { Box } from '@atlaskit/primitives';
      export function Mixed() {
          return /*#__PURE__*/ jsx(React.Fragment, null, /*#__PURE__*/ jsx(Box, {
              xcss: "_9ad05scu"
          }), /*#__PURE__*/ jsx("div", {
              className: ax([
                  "_9ad032ev"
              ])
          }));
      }
      "
    `);
  });
  // processXcss option is not supported in swc-plugin2
});
