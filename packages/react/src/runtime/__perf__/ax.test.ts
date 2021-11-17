import { runBenchmark } from '@compiled/benchmark';

import { ax } from '../index';

describe('ax benchmark', () => {
  it('completes with ax() string as the fastest', async () => {
    const arr = [
      '_19itglyw',
      '_2rko1l7b',
      '_ca0qftgi',
      '_u5f319bv',
      '_n3tdftgi',
      '_19bv19bv',
      '_bfhk1mzw',
      '_syazu67f',
      '_k48p1nn1',
      '_ect41kw7',
      '_1wybdlk8',
      '_irr3mlcl',
      '_1di6vctu',
      undefined,
    ];

    // Remove undefined and join the strings
    const str = arr.slice(0, -1).join(' ');

    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() array',
        fn: () => ax(arr),
      },
      {
        name: 'ax() string',
        fn: () => ax([str, undefined]),
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['ax() string'],
    });
  }, 30000);
});
