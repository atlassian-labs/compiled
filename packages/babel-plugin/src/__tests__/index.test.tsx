import { transformSync, TransformOptions } from '@babel/core';
import compiledPlugin from '../index';

const babelOpts: TransformOptions = {
  configFile: false,
  babelrc: false,
  plugins: ['@babel/plugin-syntax-jsx', compiledPlugin],
};

describe('babel plugin', () => {
  it('should not change code where there is no compiled components', () => {
    const output = transformSync(
      `
      const one = 1;
    `,
      babelOpts
    );

    expect(output?.code).toEqual('const one = 1;');
  });

  it('should add nonce from options', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/css-in-js';

      styled.div\`
        font-size: 12px;
      \`;
    `,
      {
        configFile: false,
        babelrc: false,
        plugins: ['@babel/plugin-syntax-jsx', [compiledPlugin, { nonce: '__webpack_nonce__' }]],
      }
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from \\"react\\";
      import { Style } from '@compiled/css-in-js';
      React.forwardRef(({
        as: C = \\"div\\",
        ...props
      }, ref) => <><Style hash=\\"1x3e11p\\" nonce={__webpack_nonce__}>{[\\".cc-1x3e11p{font-size:12px;}\\"]}</Style><C {...props} ref={ref} className={\\"cc-1x3e11p\\" + (props.className ? \\" \\" + props.className : \\"\\")} /></>);"
    `);
  });

  it('should transform a styled component', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/css-in-js';

      styled.div\`
        font-size: 12px;
      \`;
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from \\"react\\";
      import { Style } from '@compiled/css-in-js';
      React.forwardRef(({
        as: C = \\"div\\",
        ...props
      }, ref) => <><Style hash=\\"1x3e11p\\">{[\\".cc-1x3e11p{font-size:12px;}\\"]}</Style><C {...props} ref={ref} className={\\"cc-1x3e11p\\" + (props.className ? \\" \\" + props.className : \\"\\")} /></>);"
    `);
  });

  it('should transform css prop', () => {
    const output = transformSync(
      `
      import * as React from 'react';
      import '@compiled/css-in-js';

      <div css={{ fontSize: 12 }} />
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from 'react';
      import { Style } from '@compiled/css-in-js';
      <><Style hash=\\"1iqe21w\\">{[\\".cc-1iqe21w{font-size:12px;}\\"]}</Style><div className=\\"cc-1iqe21w\\" /></>;"
    `);
  });

  it('should transform classnames component', () => {
    const output = transformSync(
      `
      import { ClassNames } from '@compiled/css-in-js';

      <ClassNames>
        {({ css }) => <div className={css({ fontSize: 12 })} />}
      </ClassNames>
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from \\"react\\";
      import { Style } from '@compiled/css-in-js';
      <><Style hash=\\"31m7m\\">{[\\".cc-1iqe21w{font-size:12px;}\\"]}</Style><div className={\\"cc-1iqe21w\\"} /></>;"
    `);
  });
});
