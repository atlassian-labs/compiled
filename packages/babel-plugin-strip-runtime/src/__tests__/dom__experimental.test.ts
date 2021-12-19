import { join } from 'path';

import { transformSync } from '@babel/core';
import compiledBabelPlugin from '@compiled/babel-plugin/dom__experimental';

import stripRuntimeBabelPlugin from '../index';

const transform =
  (opts: { onFoundStyleRules?: (style: string[]) => void; pass: 'single' | 'multi' }) =>
  (code: TemplateStringsArray): string => {
    const { onFoundStyleRules, pass } = opts;

    if (pass === 'single') {
      const pass = transformSync(code[0], {
        babelrc: false,
        configFile: false,
        filename: join(__dirname, 'app.tsx'),
        plugins: [
          [compiledBabelPlugin, { onFoundStyleRules }],
          [stripRuntimeBabelPlugin, { onFoundStyleRules }],
        ],
      });

      return pass.code || '';
    } else {
      const firstPass = transformSync(code[0], {
        babelrc: false,
        configFile: false,
        filename: join(__dirname, 'app.tsx'),
        plugins: [[compiledBabelPlugin, { onFoundStyleRules }]],
      });

      const secondPass = transformSync(firstPass.code, {
        babelrc: false,
        configFile: false,
        filename: join(__dirname, 'app.tsx'),
        plugins: [[stripRuntimeBabelPlugin, { onFoundStyleRules }]],
      });

      return secondPass.code || '';
    }
  };

describe('strip dom__experimental', () => {
  it('should strip away runtime in a single pass', () => {
    const actual = transform({ pass: 'single' })`
      import { Style } from '@compiled/dom__experimental';

      const classNames = Style.create({ blue: { color: 'blue' } });
    `;

    expect(actual).toMatchInlineSnapshot(`
      "import { Style } from '@compiled/dom__experimental';
      const classNames = {
        \\"blue\\": \\"_syaz13q2\\"
      };"
    `);
  });

  it('should callback with found styles from a single pass', () => {
    const onFoundStyleRules = jest.fn();

    transform({ pass: 'single', onFoundStyleRules })`
      import { Style } from '@compiled/dom__experimental';

      const classNames = Style.create({ blue: { color: 'blue' }, red: { color: 'red' } });
    `;

    expect(onFoundStyleRules).toHaveBeenNthCalledWith(1, [
      '._syaz13q2{color:blue}',
      '._syaz5scu{color:red}',
    ]);
  });

  it('should strip away runtime in multiple passes', () => {
    const actual = transform({ pass: 'multi' })`
      import { Style } from '@compiled/dom__experimental';

      const classNames = Style.create({ blue: { color: 'blue' } });
    `;

    expect(actual).toMatchInlineSnapshot(`
      "import { Style } from '@compiled/dom__experimental';
      const classNames = {
        \\"blue\\": \\"_syaz13q2\\"
      };"
    `);
  });

  it('should callback with found styles from multiple passes', () => {
    const onFoundStyleRules = jest.fn();

    transform({ pass: 'multi', onFoundStyleRules })`
      import { Style } from '@compiled/dom__experimental';

      const classNames = Style.create({ blue: { color: 'blue' }, red: { color: 'red' } });
    `;

    expect(onFoundStyleRules).toHaveBeenNthCalledWith(1, [
      '._syaz13q2{color:blue}',
      '._syaz5scu{color:red}',
    ]);
  });
});
