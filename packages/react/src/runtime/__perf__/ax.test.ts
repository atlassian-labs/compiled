import { runBenchmark } from '@compiled/benchmark';

import { ax } from '../index';

describe('ax benchmark', () => {
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

  it('completes with ax() string as the fastest', async () => {
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

  it('completes with ax() non-compresssed class names as the fastest', async () => {
    const arrWithCompressedClassNames = arr.map((item) =>
      item ? [item.slice(1, 4), item.slice(8, undefined)] : item
    );
    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() array',
        fn: () => ax(arr),
      },
      {
        name: 'ax() array with compressed class names',
        fn: () => ax(arrWithCompressedClassNames),
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['ax() array with compressed class names'],
    });
  }, 30000);
});
