import { createStyleSheet as css } from './playground';
import createStyleSheet from '@compiled/react/dist/runtime/sheet';
import type { Event as BenchmarkEvent } from 'benchmark';
import Benchmark from 'benchmark';

console.log('Start stylesheet benchmarking');
console.log();

const suite = new Benchmark.Suite('stylesheet');

// @ts-ignore
global.document = {
  createTextNode: () => {},
  head: {
    insertBefore: () => {},
  },
  createElement: () => ({
    appendChild: () => {},
  }),
};

suite
  .add('stylesheet() current', () => {
    const sheet = createStyleSheet({});

    [
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
    ].map(sheet);
  })
  .add('stylesheet() playground', () => {
    const sheet = css({});

    [
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
    ].map(sheet);
  })
  .on('cycle', (event: BenchmarkEvent) => {
    console.log('==> ', String(event.target));
  })
  .on('complete', () => {
    console.log();
    console.log(`Fastest is ${suite.filter('fastest').map(({ name }: { name: string }) => name)}`);
  })
  .run({ async: true });
