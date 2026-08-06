import { runBenchmark } from '@compiled/benchmark';
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { memo, type JSX } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { CC, CS } from '../index';

const MemoCS = memo(CS, () => true);

import { StyleBucketFromArray, StyleBucketFromString } from './utils/cs';

describe('CS benchmark', () => {
  describe.each(['server', 'client'])('on the %s', (env) => {
    const document = globalThis.document;
    const window = globalThis.window;

    // A React 18 root may only be created once per container — recreating it on
    // every iteration warns and leaves renders pending after teardown. The root
    // is kept for the whole suite so each iteration measures a re-render, which
    // is what the legacy `ReactDOM.render(el, container)` benchmark measured.
    let root: Root | undefined;

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
        root = createRoot(globalThis.document.getElementById('root')!);
      }
    });

    afterAll(() => {
      // Unmount before the globals are restored, otherwise React commits
      // against a `window` that no longer exists.
      root && flushSync(() => root!.unmount());
      root = undefined;
      globalThis.document = document;
      globalThis.window = window;
    });

    // On the client the number of children dominates: a single concatenated
    // sheet means one cache lookup per re-render, whereas the array variant
    // walks every rule. Memoisation is not the differentiator — re-rendering
    // `CS` is already free once its sheets are cached, so `memo` only adds a
    // comparator call.
    const fastest =
      env === 'server'
        ? ['StyleBucketFromArray', 'StyleBucketFromString']
        : ['CS (1 array element)', 'MemoCS (1 array element)'];

    it(`completes with [${fastest.join(', ')}] as the fastest`, async () => {
      // Collision-resistant (11-char) atomic sheets from `transformCss()`.
      const stylesArr = [
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

      const stylesStr = stylesArr.join('');

      // Length-agnostic: class sits between `.` and `{` (9- or 11-char).
      const className = stylesArr.map((rule) => rule.slice(1, rule.indexOf('{'))).join(' ');
      const nonce = 'k0Mp1lEd';

      const renderJSX =
        env === 'server'
          ? (jsx: (key: number) => JSX.Element) => {
              renderToString(<>{Array.from({ length: 10 }).map((_, i) => jsx(i))}</>);
            }
          : (jsx: (key: number) => JSX.Element) => {
              // `flushSync` keeps the commit inside the timed function; without
              // it the benchmark only measures scheduling and the work lands
              // after the suite has torn down its JSDOM globals.
              flushSync(() => {
                root!.render(<>{Array.from({ length: 10 }).map((_, i) => jsx(i))}</>);
              });
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
