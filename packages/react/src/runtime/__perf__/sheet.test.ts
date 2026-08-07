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
  it('completes without errors', async () => {
    // Collision-resistant (11-char) atomic sheets from `transformCss()`.
    const rules = [
      '._1RrJLiBwqQ{vertical-align:top}',
      '._4bt5LAnQyn{overflow-x:hidden}',
      '._2WAcuGnQyn{overflow-y:hidden}',
      '._39HuIbz8Lp{text-overflow:ellipsis}',
      '._1ANEUSLRg7{white-space:nowrap}',
      '._0Of8r2dnbC{padding-top:0}',
      '._1ZnuxbUNDJ{padding-right:4px}',
      '._1wydGWdnbC{padding-bottom:0}',
      '._2Zuz6QUNDJ{padding-left:4px}',
      '._1EqgXlmauj{max-width:100px}',
      '._39xV02N91d{width:100%}',
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

    expect(benchmark).toBeDefined();
  }, 30000);
});
