import React from 'react';
import { renderToString } from 'react-dom/server';
import Benchmark, { Event as BenchmarkEvent } from 'benchmark';
import { CC, CS } from '@compiled/core';

console.log('Start ssr benchmarking');
console.log();

const App = () => (
  <CC>
    <CS>
      {[
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
      ]}
    </CS>
    <span
      className="_bfhk1jys _2rko1l7b _vchhusvi _syaz4rde _1e0c1o8l _1wyb1skh _k48p1fw0 _vwz4kb7n _p12f1osq _ca0qyh40 _u5f3idpf _n3td1l7b _19bvidpf _1p1dangw _s7n41q9y"
      // @ts-ignore
      style={{ '--_16owtcm': 'rgb(227, 252, 239)', '--_kmurgp': 'rgb(0, 102, 68)' }}>
      <span>Lozenge</span>
    </span>
  </CC>
);

renderToString(<App />);

const suite = new Benchmark.Suite('ssr');

suite
  .add('ssr current', () => {
    renderToString(
      <CC>
        <CS>
          {[
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
          ]}
        </CS>
        <span
          className="_bfhk1jys _2rko1l7b _vchhusvi _syaz4rde _1e0c1o8l _1wyb1skh _k48p1fw0 _vwz4kb7n _p12f1osq _ca0qyh40 _u5f3idpf _n3td1l7b _19bvidpf _1p1dangw _s7n41q9y"
          // @ts-ignore
          style={{ '--_16owtcm': 'rgb(227, 252, 239)', '--_kmurgp': 'rgb(0, 102, 68)' }}>
          <span>Lozenge</span>
        </span>
      </CC>
    );
  })
  .on('cycle', (event: BenchmarkEvent) => {
    console.log('==> ', String(event.target));
  })
  .on('complete', () => {
    console.log();
    console.log(`Fastest is ${suite.filter('fastest').map(({ name }: { name: string }) => name)}`);
  })
  .run({ async: true });
