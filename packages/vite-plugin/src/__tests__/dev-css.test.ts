/**
 * @jest-environment node
 */

import { execFileSync } from 'child_process';
import { join } from 'path';

describe('development Compiled CSS', () => {
  it('uses Vite-processed CSS and sorts the active modules in one stylesheet', () => {
    const output = execFileSync(
      process.execPath,
      [join(__dirname, '__fixtures__/dev-css-order/run-vite.cjs')],
      {
        cwd: join(__dirname, '../../../..'),
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_NO_WARNINGS: '1',
          VITE_CJS_IGNORE_WARNING: '1',
        },
      }
    );
    const { dev, production } = JSON.parse(output);
    const perModuleCss = dev.inlineCss.join('\n');

    // The fixture deliberately imports overrides before their base and
    // shorthand rules, reproducing the three cross-file failures from #1895.
    expect(perModuleCss.indexOf('._weight')).toBeLessThan(perModuleCss.indexOf('._font'));
    expect(perModuleCss.indexOf('._border-width {')).toBeLessThan(
      perModuleCss.indexOf('._border {')
    );
    expect(perModuleCss.indexOf('@media')).toBeLessThan(perModuleCss.indexOf('._base'));

    expect(dev.entry.match(/css-proxy:/g)).toHaveLength(2);
    expect(dev.proxies).toHaveLength(2);
    for (const proxy of dev.proxies) {
      expect(proxy).toMatch(/import css from "\/[^"]+\.compiled\.css\?inline"/);
      expect(proxy).toContain('registerCompiledCss(id, css)');
      expect(proxy).toContain('import.meta.hot.accept()');
      expect(proxy).toContain('import.meta.hot.prune');
    }

    // `?inline` still runs Vite's CSS pipeline, including relative URL rewriting.
    expect(perModuleCss).toContain("url('/test-base/asset.svg')");
    expect(perModuleCss).not.toContain("url('./asset.svg')");

    expect(dev.sortedCss.indexOf('._font')).toBeLessThan(dev.sortedCss.indexOf('._weight'));
    expect(dev.sortedCss.indexOf('._border {')).toBeLessThan(
      dev.sortedCss.indexOf('._border-width {')
    );
    expect(dev.sortedCss.indexOf('._base')).toBeLessThan(dev.sortedCss.indexOf('@media'));

    expect(dev.browserRuntime).toEqual(
      expect.objectContaining({
        combinedCss: dev.sortedCss,
        cssBeforeSort: '',
        nonce: 'test-nonce',
        styleCount: 1,
        styleCountBeforeSort: 1,
        styleCountAfterPrune: 0,
      })
    );
    expect(dev.browserRuntime.cssAfterHmr).toContain('display: block');
    expect(dev.browserRuntime.cssAfterHmr).not.toContain('display: none');
    expect(dev.browserRuntime.cssAfterPrune).toContain('._base');
    expect(dev.browserRuntime.cssAfterPrune).not.toContain('._weight');
    expect(dev.runtime).toContain('const endpoint = "/test-base/@compiled/vite-plugin/sort-css"');
    expect(dev.runtime).toContain('data-compiled-vite-dev-id');

    // Inline CSS updates propagate into self-accepting JavaScript proxies.
    for (const hmr of dev.hmr) {
      expect(hmr.proxyIsSelfAccepting).toBe(true);
      expect(hmr.inlineIsSelfAccepting).toBe(false);
      expect(hmr.inlineImporters).toHaveLength(1);
      expect(hmr.inlineImporters[0]).toContain('css-proxy:');
    }

    // SSR and production builds retain Vite's normal CSS handling.
    expect(dev.ssr).toContain('/overrides.compiled.css');
    expect(dev.ssr).not.toContain('css-proxy:');
    expect(production.js).not.toContain('css-proxy:');
    expect(production.js).not.toContain('css-runtime');
    expect(production.css.indexOf('._font')).toBeLessThan(production.css.indexOf('._weight'));
    expect(production.css.indexOf('._border {')).toBeLessThan(
      production.css.indexOf('._border-width {')
    );
    expect(production.css.indexOf('._base')).toBeLessThan(production.css.indexOf('@media'));
  });
});
