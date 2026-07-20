import { runBenchmark } from '@compiled/benchmark';

import { ax } from '../index';

describe('ax benchmark', () => {
  // Real 6-char base-62 group prefixes from actual Compiled output (various CSS properties)
  // Each chunk is a 6-char group; values are 4-char suffixes — together forming 11-char classes
  const groups: string[] = ['1UtDYz', '4ya3eE', '3iDTPb', '1DCdHi', '30huDK', '3ONivY', '09lB87'];
  const values: string[] = ['ynoA', 'rjyG', 'vLZJ', 'Jg58', 'tfxT', 'rjyG', 'YbGa'];
  const uniques: string[] = groups.map((g, i) => `_${g}${values[i]}`);
  const withClashes: string[] = [
    ...Array.from({ length: 4 }, () => `_${groups[0]}${values[0]}`),
    ...Array.from({ length: 6 }, () => `_${groups[0]}${values[1]}`),
    ...Array.from({ length: 8 }, () => `_${groups[0]}${values[2]}`),
  ];

  const getRandomRules = (() => {
    function randomGroup() {
      return groups[Math.floor(Math.random() * groups.length)];
    }
    function randomValue() {
      return values[Math.floor(Math.random() * values.length)];
    }

    return function create(): string[] {
      return Array.from({ length: 20 }, () => `_${randomGroup()}${randomValue()}`);
    };
  })();

  it('completes with ax() string as the fastest', async () => {
    const benchmark = await runBenchmark('ax', [
      {
        name: 'ax() single',
        fn: () => ax(['_1UtDYzynoA']),
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
