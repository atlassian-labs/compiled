import { transformSync } from '@babel/core';
import babelPlugin from '../index';

const transform = (code: string) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    plugins: [babelPlugin],
  })?.code;
};

describe('css builder', () => {
  it('should keep nested unconditional css together', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ '@media screen': { color: 'red', fontSize: 20 } }} />
    `);

    expect(actual).toInclude('@media screen{._43475scu{color:red}._1yzygktf{font-size:20px}}');
  });
});
