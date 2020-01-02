/** @jsx jsx */
import { jsx } from '../index';
import { render } from '@testing-library/react';
import * as pkg from '../../../package.json';

describe('jsx pragma runtime', () => {
  it('should blow up if not compiled', () => {
    expect(() => {
      render(<div>hello world</div>);
    }).toThrowErrorMatchingInlineSnapshot(`
"${pkg.name}

You need to apply the typescript transformer to use this!
You can apply it from \`${pkg.name}/ts-transformer\`."
`);
  });
});
