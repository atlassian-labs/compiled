import { transformSync } from '@babel/core';

import plugin from '../index';

const transform = (code: TemplateStringsArray): string => {
  const fileResult = transformSync(code[0], {
    babelrc: false,
    comments: false,
    configFile: false,
    plugins: [plugin],
  });

  return fileResult?.code || '';
};

describe('@compiled/babel-plugin-experimental', () => {
  it('should transform a css function', () => {
    const actual = transform`
      const style = css({
        color: 'black',
        ':hover': {
          color: 'red',
        }
      });
    `;

    expect(actual).toMatchInlineSnapshot(
      `"const style = [\\"_syaz11x8 _30l35scu\\", [\\"._syaz11x8{color:black}\\", \\"._30l35scu:hover{color:red}\\"]];"`
    );
  });
});
