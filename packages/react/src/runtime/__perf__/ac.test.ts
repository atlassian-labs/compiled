import { runBenchmark } from '@compiled/benchmark';

import { ac } from '../ac';
import ax from '../ax';

describe('ac vs ax benchmark', () => {
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
    // `undefined` is an acceptable parameter so we want to include it in the test case.
    // Example: ax(['aaaabbbb', foo() && "aaaacccc"])
    undefined,
  ];

  // Remove undefined and join the strings
  const str = arr.slice(0, -1).join(' ');

  const arrWithCompressedClassNames = arr.map((item) =>
    item ? `${item.slice(0, 4)}_${item.slice(8)}` : item
  );

  const strWithCompressedClassNames = arr
    .map((item) => (item ? `${item.slice(0, 4)}_${item.slice(8)}` : item))
    .slice(0, -1)
    .join(' ');

  it('compares ax array with ac array', async () => {
    // Remove undefined and join the strings
    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() array',
        fn: () => ax(arr),
      },
      {
        name: 'ac() array with compressed class names',
        fn: () => {
          ac(arrWithCompressedClassNames)?.toString();
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['ax() array'],
    });
  }, 30000);

  it('compares ax string with ac string', async () => {
    // Remove undefined and join the strings
    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() string',
        fn: () => ax([str, undefined]),
      },
      {
        name: 'ac() string with compressed class names',
        fn: () => {
          ac([strWithCompressedClassNames, undefined])?.toString();
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['ax() string'],
    });
  }, 30000);

  it('compares chaining ax with chaining ac', async () => {
    // Remove undefined and join the strings
    const benchmark = await runBenchmark('ax', [
      {
        name: 'chain ax() string',
        fn: () => ax([ax([str, undefined]), '_aaaabbbb']),
      },
      {
        name: 'chain ac() string with compressed class names',
        fn: () => {
          ac([ac([strWithCompressedClassNames, undefined]), '_aaaa_a'])?.toString();
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['chain ac() string with compressed class names'],
    });
  }, 30000);
});
