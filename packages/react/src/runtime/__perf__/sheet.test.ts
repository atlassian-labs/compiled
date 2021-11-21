import { runBenchmark } from '@compiled/benchmark';

import insertRule from '../sheet';

import { createStyleSheet } from './utils/sheet';

global.document = {
  // @ts-expect-error
  createTextNode: () => {},
  head: {
    // @ts-expect-error
    insertBefore: () => {},
  },
  // @ts-expect-error
  createElement: () => ({
    appendChild: () => {},
  }),
};

describe('sheet benchmark', () => {
  it('completes with insertRule as the fastest', async () => {
    const rules = [
      '._s7n4jp4b{vertical-align:top}',
      '._1reo15vq{overflow-x:hidden}',
      '._18m915vq{overflow-y:hidden}',
      '._1bto1l2s{text-overflow:ellipsis}',
      '._o5721q9c{white-space:nowrap}',
      '._ca0qidpf{padding-top:0}',
      '._u5f31y44{padding-right:4px}',
      '._n3tdidpf{padding-bottom:0}',
      '._19bv1y44{padding-left:4px}',
      '._p12f12xx{max-width:100px}',
      '._1bsb1osq{width:100%}',
    ];

    const benchmark = await runBenchmark('sheet', [
      {
        name: 'insertRule',
        fn: () => {
          for (const rule of rules) {
            insertRule(rule, {});
          }
        },
      },
      {
        name: 'createStyleSheet',
        fn: () => {
          const sheet = createStyleSheet({});

          for (const rule of rules) {
            sheet(rule);
          }
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: expect.arrayContaining(['insertRule']),
    });
  }, 30000);
});
