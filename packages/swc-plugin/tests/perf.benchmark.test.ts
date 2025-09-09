import * as path from 'path';

import { transformSync as babelTransformSync } from '@babel/core';

import { transformSyncFast as swcTransform } from './swc-output';

const ITERATIONS = Number(process.env.PERF_ITERS || 200);
const PERF_TIMEOUT_MS = Number(process.env.PERF_TIMEOUT_MS || 60000);

jest.setTimeout(PERF_TIMEOUT_MS);

type BenchResult = {
  name: string;
  opsPerSec: number;
};

function benchSync(name: string, runOnce: () => void, iters: number): BenchResult {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iters; i++) {
    runOnce();
  }
  const end = process.hrtime.bigint();
  const ns = Number(end - start);
  const secs = ns / 1e9;
  const opsPerSec = iters / secs;
  return { name, opsPerSec };
}

function toFixed(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

// Snippets for each API
const codeCss = `
  import { css } from '@compiled/react';
  const styles = css({ color: 'red', padding: 4, ':hover': { color: 'blue' } });
`;

const codeCssMap = `
  import { cssMap } from '@compiled/react';
  const map = cssMap({
    primary: { color: 'rebeccapurple', padding: '8px 4px' },
    danger: { color: 'red', '&:hover': { color: 'darkred' } },
    '@media screen and (min-width: 600px)': {
      primary: { color: 'purple' }
    }
  });
`;

const codeStyled = `
  import { styled } from '@compiled/react';
  const Button = styled.button({
    backgroundColor: 'black',
    color: 'white',
    padding: 8,
    ':hover': { opacity: 0.9 }
  });
`;

const codeKeyframes = `
  import { keyframes } from '@compiled/react';
  const fade = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } });
`;

// Resolve compiled babel plugin from dist to avoid TS config issues
const pluginPath = path.join(__dirname, '../../babel-plugin/dist/index.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compiledBabelPlugin = require(pluginPath);

// Babel options mirroring repository settings for fair comparison
const babelOptions = {
  filename: 'test.tsx',
  babelrc: false as const,
  configFile: false as const,
  presets: [
    [require.resolve('@babel/preset-env'), { targets: { node: 'current' } }],
    require.resolve('@babel/preset-typescript'),
    [require.resolve('@babel/preset-react'), { runtime: 'automatic' }],
  ],
  plugins: [
    [
      compiledBabelPlugin,
      {
        nonce: '"k0Mp1lEd"',
        importReact: false,
        parserBabelPlugins: ['typescript'],
        optimizeCss: false,
        importSources: ['@compiled/react'],
      },
    ],
  ],
};

describe('performance: swc-plugin vs babel-plugin', () => {
  it('reports ops/sec for css, cssMap, styled, keyframes', async () => {
    // Ensure transforms produce some output
    const sanity = swcTransform(codeCss, { forceEnable: true, extract: true });
    expect(sanity.length).toBeGreaterThan(0);
    const sanityBabel = babelTransformSync(codeCss, babelOptions)!.code || '';
    expect(sanityBabel.length).toBeGreaterThan(0);

    const results: BenchResult[] = [];

    // SWC benches (sync only)
    results.push(
      benchSync(
        'swc css',
        () => {
          const out = swcTransform(codeCss, { forceEnable: true, extract: true });
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'swc cssMap',
        () => {
          const out = swcTransform(codeCssMap, { forceEnable: true, extract: true });
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'swc styled',
        () => {
          const out = swcTransform(codeStyled, { forceEnable: true, extract: true });
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'swc keyframes',
        () => {
          const out = swcTransform(codeKeyframes, { forceEnable: true, extract: true });
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );

    // Babel benches (sync)
    results.push(
      benchSync(
        'babel css',
        () => {
          const out = babelTransformSync(codeCss, babelOptions)!.code || '';
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'babel cssMap',
        () => {
          const out = babelTransformSync(codeCssMap, babelOptions)!.code || '';
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'babel styled',
        () => {
          const out = babelTransformSync(codeStyled, babelOptions)!.code || '';
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );
    results.push(
      benchSync(
        'babel keyframes',
        () => {
          const out = babelTransformSync(codeKeyframes, babelOptions)!.code || '';
          if (!out) throw new Error('empty');
        },
        ITERATIONS
      )
    );

    // Report
    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(`${r.name}: ${toFixed(r.opsPerSec)} ops/sec (${ITERATIONS} iters)`);
    }

    // Keep test passing without asserting perf
    expect(results.length).toBe(8);
  });
});
