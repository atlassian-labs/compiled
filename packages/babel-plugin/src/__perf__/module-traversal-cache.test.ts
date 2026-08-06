import { join } from 'path';

import { runBenchmark } from '@compiled/benchmark';

import { transform as transformCode } from '../test-utils';

const code = `
  import '@compiled/react';

  import { colorMixin } from '../__fixtures__/mixins/objects';
  import { secondary } from '../__fixtures__/mixins/simple';

  <div
    css={{
      fontSize: 15,
      ...colorMixin(),
      border: \`3px solid \${secondary}\`
    }}
  />
`;

const transform = (options = {}) =>
  transformCode(code, {
    cache: false,
    filename: join(__dirname, 'module-traversal-cache.js'),
    ...options,
  });

describe('module traversal cache benchmark', () => {
  it('transforms the code correctly', () => {
    expect(transform()).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      import { colorMixin } from "../__fixtures__/mixins/objects";
      import { secondary } from "../__fixtures__/mixins/simple";
      const _4 = "._0KLXruy8mA{background-color:pink}";
      const _3 = "._1UtDYzGowl{color:red}";
      const _2 = "._4ya3eE2sAl{font-size:15px}";
      const _ = "._30huDKzh4V{border:3px solid pink}";
      <CC>
        <CS>{[_, _2, _3, _4]}</CS>
        {<div className={ax(["_30huDKzh4V _4ya3eE2sAl _1UtDYzGowl _0KLXruy8mA"])} />}
      </CC>;
      "
    `);
  });

  it('completes with cache as the fastest', async () => {
    const minSamples = 75;
    const benchmark = await runBenchmark('module traversal cache', [
      {
        name: 'initial run',
        fn: () => transform(),
        minSamples,
      },
      {
        name: 'cache',
        fn: () => transform({ cache: true }),
        minSamples,
      },
      {
        name: 'no-cache',
        fn: () => transform({ cache: false }),
        minSamples,
      },
    ]);

    expect(benchmark).toMatchObject({
      // Cache must appear in fastest
      fastest: expect.arrayContaining(['cache']),
    });
  }, 60000);
});
