/** @jsx jsx */
import { jsx } from '../index';
import { render } from '@testing-library/react';

describe('jsx pragma runtime', () => {
  it('should blow up if not compiled', () => {
    expect(() => {
      render(<div>hello world</div>);
    }).toThrowErrorMatchingInlineSnapshot(`
"@untitled/css-in-js-project

You need to apply the typescript transformer to use this!
You can apply it from \`@untitled/css-in-js-project/transformer\`."
`);
  });
});
