import { runBenchmark } from '@compiled/benchmark';

import { ax } from '../index';

describe('ax benchmark', () => {
  const chunks: string[] = ['aaaa', 'bbbb', 'cccc', 'dddd', 'eeee', 'ffff', 'gggg'];
  const uniques: string[] = chunks.map((chunk) => `_${chunk}${chunk}`);
  const withClashes: string[] = [
    ...Array.from({ length: 4 }, () => `_${chunks[0]}${chunks[0]}`),
    ...Array.from({ length: 6 }, () => `_${chunks[0]}${chunks[1]}`),
    ...Array.from({ length: 8 }, () => `_${chunks[0]}${chunks[2]}`),
  ];

  const getRandomRules = (() => {
    function randomChunk() {
      return chunks[Math.floor(Math.random() * chunks.length)];
    }

    return function create(): string[] {
      return Array.from({ length: 20 }, () => `_${randomChunk()}${randomChunk()}`);
    };
  })();

  it('completes with ax() string as the fastest', async () => {
    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() single',
        fn: () => ax(['_aaaabbbb']),
      },
      {
        name: 'ax() uniques (array)',
        fn: () => ax(uniques),
      },
      {
        name: 'ax() uniques (as a string)',
        fn: () => ax([uniques.join(' ')]),
      },
      {
        name: 'ax() clashes',
        fn: () => ax(withClashes),
      },
      {
        name: 'ax() clashes (as a string)',
        fn: () => ax([withClashes.join(' ')]),
      },
      {
        name: 'ax() random keys (no clashes)',
        fn: () => ax(getRandomRules()),
      },
      {
        name: 'ax() random keys (with clashes)',
        fn: () => {
          const random = getRandomRules();
          ax([...random, ...random, ...random]);
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: ['ax() single'],
    });
  }, 90000);
});
