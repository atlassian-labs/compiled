import Benchmark, { Event as BenchmarkEvent } from 'benchmark';
import { transformSync } from '@babel/core';

import babelPlugin from '../index';

const suite = new Benchmark.Suite('module-traversal-cache');

const transform = (code: string, options = { cache: false }) => {
  return transformSync(code, {
    configFile: false,
    babelrc: false,
    compact: true,
    highlightCode: false,
    filename: process.cwd() + '/src/__perf__/module-traversal-caching.js',
    plugins: [[babelPlugin, options]],
  })?.code;
};

suite
  .add('#initial-run', () => {
    transform(
      `
      import '@compiled/react';
      import React from 'react';

      import { colorMixin } from '../__fixtures__/mixins/objects';
      import { secondary } from '../__fixtures__/mixins/simple';

      <div css={{ fontSize: 15, ...colorMixin(), border: \`3px solid \${secondary}\` }} />
    `
    );
  })
  .add('#with-cache', () => {
    transform(
      `
      import '@compiled/react';
      import React from 'react';

      import { colorMixin } from '../__fixtures__/mixins/objects';
      import { secondary } from '../__fixtures__/mixins/simple';

      <div css={{ fontSize: 12, ...colorMixin(), border: \`2px solid \${secondary}\` }} />
    `,
      { cache: true }
    );
  })
  .add('#no-cache', () => {
    transform(
      `
      import '@compiled/react';
      import React from 'react';

      import { colorMixin } from '../__fixtures__/mixins/objects';
      import { secondary } from '../__fixtures__/mixins/simple';

      <div css={{ fontSize: 9, ...colorMixin(), border: \`1px solid \${secondary}\` }} />
    `
    );
  })
  .on('cycle', (event: BenchmarkEvent) => {
    console.log(String(event.target));
  })
  .on('complete', () => {
    console.log(`Fastest is ${suite.filter('fastest').map(({ name }: { name: string }) => name)}`);
  })
  .run({ async: true });
