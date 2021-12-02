import { runBenchmark } from '@compiled/benchmark';
import * as React from 'react';
import { renderToString } from 'react-dom/server';

import { CC, CS } from '../index';

import { StyleArr, StyleStr } from './utils/cs';

describe('CS benchmark', () => {
  it('completes with CS (1 array element) or StyleArr as the fastest', async () => {
    const stylesArr = [
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

    const stylesStr = stylesArr.join('');

    const className = [
      '_bfhk1jys',
      '_2rko1l7b',
      '_vchhusvi',
      '_syaz4rde',
      '_1e0c1o8l',
      '_1wyb1skh',
      '_k48p1fw0',
      '_vwz4kb7n',
      '_p12f1osq',
      '_ca0qyh40',
      '_u5f3idpf',
      '_n3td1l7b',
      '_19bvidpf',
      '_1p1dangw',
      '_s7n41q9y',
    ].join(' ');

    const style = {
      '--_16owtcm': 'rgb(227, 252, 239)',
      '--_kmurgp': 'rgb(0, 102, 68)',
    } as any;

    const nonce = 'k0Mp1lEd';

    const benchmark = await runBenchmark('CS', [
      {
        name: 'CS (1 array element)',
        fn: () => {
          renderToString(
            <CC>
              <CS nonce={nonce}>{[stylesStr]}</CS>
              <span className={className} style={style}>
                hello world
              </span>
            </CC>
          );
        },
      },
      {
        name: 'CS (n array elements)',
        fn: () => {
          renderToString(
            <CC>
              <CS nonce={nonce}>{stylesArr}</CS>
              <span className={className} style={style}>
                hello world
              </span>
            </CC>
          );
        },
      },
      {
        name: 'StyleArr',
        fn: () => {
          renderToString(
            <CC>
              <StyleArr nonce={nonce}>{stylesArr}</StyleArr>
              <span className={className} style={style}>
                hello world
              </span>
            </CC>
          );
        },
      },
      {
        name: 'StyleStr',
        fn: () => {
          renderToString(
            <CC>
              <StyleStr nonce={nonce}>{stylesStr}</StyleStr>
              <span className={className} style={style}>
                hello world
              </span>
            </CC>
          );
        },
      },
    ]);

    expect(benchmark).toMatchObject({
      fastest: expect.not.arrayContaining(['StyleStr', 'CS (n array elements)']),
    });
  }, 30000);
});
