import { runBenchmark } from '@compiled/benchmark';
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { memo } from 'react';
import { render } from 'react-dom';
import { renderToString } from 'react-dom/server';

import { CC, CS } from '../index';

const MemoCS = memo(CS, () => true);

import { StyleBucketFromArray, StyleBucketFromString } from './utils/cs';

describe('CS benchmark', () => {
  describe.each(['server', 'client'])('on the %s', (env) => {
    const document = globalThis.document;
    const window = globalThis.window;

    beforeAll(() => {
      if (env === 'server') {
        // @ts-expect-error
        delete globalThis.document;
        // @ts-expect-error
        delete globalThis.window;
      } else {
        const dom = new JSDOM('<div id="root"></div>');
        globalThis.document = dom.window.document;
        // @ts-expect-error
        globalThis.window = dom.window;
      }
    });

    afterAll(() => {
      globalThis.document = document;
      globalThis.window = window;
    });

    const fastest =
      env === 'server'
        ? ['StyleBucketFromArray', 'StyleBucketFromString']
        : ['MemoCS (1 array element)', 'MemoCS (n array elements)'];

    it(`completes with [${fastest.join(', ')}] as the fastest`, async () => {
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

      const className = stylesArr.map((rule) => rule.slice(1, 10)).join(' ');
      const nonce = 'k0Mp1lEd';

      const renderJSX =
        env === 'server'
          ? (jsx: (key: number) => JSX.Element) => {
              renderToString(<>{Array.from({ length: 10 }).map((_, i) => jsx(i))}</>);
            }
          : (jsx: (key: number) => JSX.Element) => {
              render(
                <>{Array.from({ length: 10 }).map((_, i) => jsx(i))}</>,
                globalThis.document.getElementById('root')
              );
            };

      const tests = [
        {
          name: 'CS (1 array element)',
          fn: () => {
            renderJSX((key) => (
              <CC key={`cs1-${key}`}>
                <CS nonce={nonce}>{[stylesStr]}</CS>
                <div className={className} />
              </CC>
            ));
          },
        },
        {
          name: 'CS (n array elements)',
          fn: () => {
            renderJSX((key) => (
              <CC key={`csn-${key}`}>
                <CS nonce={nonce}>{stylesArr}</CS>
                <div className={className} />
              </CC>
            ));
          },
        },
        {
          name: 'MemoCS (1 array element)',
          fn: () => {
            renderJSX((key) => (
              <CC key={`memo-cs1-${key}`}>
                <MemoCS nonce={nonce}>{[stylesStr]}</MemoCS>
                <div className={className} />
              </CC>
            ));
          },
        },
        {
          name: 'MemoCS (n array elements)',
          fn: () => {
            renderJSX((key) => (
              <CC key={`memo-csn-${key}`}>
                <MemoCS nonce={nonce}>{stylesArr}</MemoCS>
                <div className={className} />
              </CC>
            ));
          },
        },
        ...(env === 'server'
          ? [
              {
                name: 'StyleBucketFromArray',
                fn: () => {
                  renderJSX((key) => (
                    <CC key={`sbfa-${key}`}>
                      <StyleBucketFromArray nonce={nonce}>{stylesArr}</StyleBucketFromArray>
                      <div className={className} />
                    </CC>
                  ));
                },
              },
              {
                name: 'StyleBucketFromString',
                fn: () => {
                  renderJSX((key) => (
                    <CC key={`sbfs-${key}`}>
                      <StyleBucketFromString nonce={nonce}>{stylesStr}</StyleBucketFromString>
                      <div className={className} />
                    </CC>
                  ));
                },
              },
            ]
          : []),
      ];

      const benchmark = await runBenchmark('CS', tests);

      const slowest = tests.map((t) => t.name).filter((n) => !fastest.includes(n));
      for (const name of slowest) {
        expect(benchmark.fastest).not.toContain(name);
      }
    }, 60000);
  });
});
