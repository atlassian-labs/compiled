import Benchmark from 'benchmark';
import type { Event as BenchmarkEvent, Options as Test } from 'benchmark';

export type Cycle = string;

export type BenchmarkResult = {
  cycles: Cycle[];
  fastest: string[];
};

export type { Test };

export const runBenchmark = (name: string, tests: Test[]): Promise<BenchmarkResult> => {
  const suite = new Benchmark.Suite(name);

  for (const test of tests) {
    suite.add(test);
  }

  return new Promise((resolve) => {
    const cycles: Cycle[] = [];
    suite
      .on('cycle', (event: BenchmarkEvent) => {
        cycles.push(String(event.target));
      })
      .on('complete', () => {
        console.log(cycles.join('\n'));
        resolve({
          cycles,
          fastest: suite.filter('fastest').map('name'),
        });
      })
      .run({ async: true });
  });
};
