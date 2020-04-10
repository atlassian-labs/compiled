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
      "import React from \\"react\\";
      import { Style } from '@compiled/css-in-js';
      React.forwardRef((props, ref) => <><Style hash=\\"css-1x3e11p\\">{[\\".css-1x3e11p{font-size:12px;}\\"]}</Style><div {...props} ref={ref} className={\\"css-1x3e11p\\" + (props.className ? \\" \\" + props.className : \\"\\")} /></>);"
    `);
  });

  it('should transform css prop', () => {
    const output = transformSync(
      `
      import React from 'react';
      import '@compiled/css-in-js';

      <div css={{ fontSize: 12 }} />
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import React from 'react';
      import { Style } from '@compiled/css-in-js';
      <><Style hash=\\"css-1iqe21w\\">{[\\".css-1iqe21w{font-size:12px;}\\"]}</Style><div className=\\"css-1iqe21w\\" /></>;"
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
      "import React from \\"react\\";
      import { Style } from '@compiled/css-in-js';
      <><Style hash=\\"css-2lhdif\\">{[\\".css-1iqe21w{font-size:12px;}\\"]}</Style><div className={\\"css-1iqe21w\\"} /></>;"
    `);
  });
});
