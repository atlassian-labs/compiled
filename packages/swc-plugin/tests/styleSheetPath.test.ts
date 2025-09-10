import { transform } from './swc-output';

const STYLE_PATH =
  '@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/compiled-css.css';

describe('styleSheetPath support (strip-runtime parity)', () => {
  it('injects require per collected rule when styleSheetPath is provided', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({ color: 'red' });
      console.log(styles);
    `;
    const out = await transform(code, {
      extract: true,
      styleSheetPath: STYLE_PATH,
      forceEnable: true,
    });
    const escaped = STYLE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`require\\(\\"${escaped}\\?style=`);
    expect(out).toMatch(re);
  });

  it('does not inject requires when styleSheetPath not provided', async () => {
    const code = `
      import { css } from '@compiled/react';
      const styles = css({ color: 'blue' });
      console.log(styles);
    `;
    const out = await transform(code, { extract: true, forceEnable: true });
    expect(out).not.toMatch(/\.compiled\.css\?style=/);
  });
});
