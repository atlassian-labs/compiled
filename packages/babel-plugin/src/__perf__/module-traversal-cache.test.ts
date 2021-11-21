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
      "const _4 = \\"._19ith012{border:3px solid pink}\\";
      const _3 = \\"._bfhk32ev{background-color:pink}\\";
      const _2 = \\"._syaz5scu{color:red}\\";
      const _ = \\"._1wybo7ao{font-size:15px}\\";
      <CC>
        <CS>{[_, _2, _3, _4]}</CS>
        {<div className={ax([\\"_1wybo7ao _syaz5scu _bfhk32ev _19ith012\\"])} />}
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
