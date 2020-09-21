import { transformSync, TransformOptions } from '@babel/core';
import babelNext from '../index';

const babelOpts: TransformOptions = {
  configFile: false,
  babelrc: false,
  plugins: [babelNext],
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

  it('should transform basic styled component', () => {
    const output = transformSync(
      `
      import { styled } from '@compiled/core';

      const MyDiv = styled.div\`
        font-size: 12px;
      \`;
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from 'react';
      import { ax, CC, CS } from '@compiled/core';
      const _ = \\".cc-1x3e11p{font-size:12px}\\";
      const MyDiv = React.forwardRef(({
        as: C = \\"div\\",
        style,
        ...props
      }, ref) => <CC>
            <CS>{[_]}</CS>
            <C {...props} style={style} ref={ref} className={ax([\\"cc-1x3e11p\\", props.className])} />
          </CC>);"
    `);
  });

  it('should transform basic css prop', () => {
    const output = transformSync(
      `
      import '@compiled/core';

      const MyDiv = () => {
        return <div css="font-size:12px;">hello</div>
      };
    `,
      babelOpts
    );

    expect(output?.code).toMatchInlineSnapshot(`
      "import * as React from 'react';
      import { ax, CC, CS } from '@compiled/core';
      const _ = \\".cc-1rr6d23{font-size:12px}\\";

      const MyDiv = () => {
        return <CC>
          <CS>{[_]}</CS>
          {<div className=\\"cc-1rr6d23\\">hello</div>}
        </CC>;
      };"
    `);
  });
});
