/**
 * @jest-environment node
 */

import { join } from 'path';

import { bundle as bundleEntry } from './test-utils';
import type { BundleOptions } from './test-utils';

describe('CompiledExtractPlugin', () => {
  const fixturesPath = join(__dirname, '..', '__fixtures__');

  const bundle = (entry: string, options: Omit<BundleOptions, 'mode'> = {}) =>
    bundleEntry(entry, {
      ...options,
      extract: true,
      mode: 'production',
    }).then((assets) => {
      for (const assetName in assets) {
        if (assetName.includes('compiled-css') && assetName.endsWith('.css')) {
          return assets[assetName];
        }
      }
      return undefined;
    });

  beforeEach(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  it('throws when the plugin is not configured', async () => {
    const errors = await bundle(join(fixturesPath, 'local-styles.tsx'), {
      disableExtractPlugin: true,
    }).catch((err) => err);

    expect(errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining("You forgot to add the 'CompiledExtractPlugin' plugin"),
      }),
    ]);
  }, 10000);

  it('works when the loader is configured with a path instead of a package name', async () => {
    const result = await bundle(join(fixturesPath, 'local-styles.tsx'), {
      requireResolveLoaderSyntax: true,
    });

    expect(result).toBeDefined();
  }, 10000);

  it('should not generate a single style sheet if cacheGroup is disabled', async () => {
    const actual = await bundle(join(fixturesPath, 'local-styles.tsx'), {
      disableCacheGroup: true,
    });

    expect(actual).toBe(undefined);
  }, 10000);

  it('extracts local styles', async () => {
    const actual = await bundle(join(fixturesPath, 'local-styles.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._1UtDYzynoA{color:blue}
      ._4ya3eEEbN9{font-size:14px}
      "
    `);
  }, 10000);

  it('extracts styles imported through a relative path', async () => {
    const actual = await bundle(join(fixturesPath, 'relative-styles.tsx'));

    // This should not contain any styles from the unused relative import ./common/css-prop, which includes
    // {color:coral} or {border:2px solid coral}
    expect(actual).toMatchInlineSnapshot(`
      "._1UtDYzsHik{color:blueviolet}
      ._1UtDYzGowl{color:red}
      ._10n1R55CUP:focus{color:purple}
      ._10n1R50axx:focus{color:orange}
      ._0clgaMynoA:hover{color:blue}
      ._0clgaMFQV5:hover{color:yellow}
      "
    `);
  }, 10000);

  it('extracts styles imported through a webpack alias', async () => {
    const assets = await bundle(join(fixturesPath, 'webpack-alias.tsx'));

    expect(assets).toMatchInlineSnapshot(`
      "._1UtDYzynoA{color:blue}
      "
    `);
  }, 10000);

  it('extracts styles imported through an overridden resolve configuration', async () => {
    const assets = await bundle(join(fixturesPath, 'loader-alias.tsx'), {
      resolve: {
        // This alias will be put into the compiled plugin options, but not the webpack resolve configuration
        alias: {
          'loader-alias': join(fixturesPath, 'lib', 'loader-alias.ts'),
        },
      },
    });

    expect(assets).toMatchInlineSnapshot(`
      "._1UtDYzHKf3{color:indigo}
      "
    `);
  }, 10000);

  it('extracts styles from an async chunk', async () => {
    const assets = await bundleEntry(join(fixturesPath, 'async-styles.ts'), {
      extract: true,
      mode: 'production',
    });

    // Only generate one CSS bundle
    const cssFiles = Object.keys(assets).filter((key) => key.endsWith('.css'));
    expect(cssFiles).toHaveLength(1);

    // Extract the styles into said bundle
    expect(assets[cssFiles[0]]).toMatchInlineSnapshot(`
      "._30huDKXFvJ{border:2px solid coral}
      ._1UtDYz7xde{color:coral}
      "
    `);
  }, 10000);

  it('extracts styles from a pre-built babel files', async () => {
    const actual = await bundle(join(fixturesPath, 'babel.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._19itlf8h{border:2px solid blue}._syaz13q2{color:blue}
      ._1wyb1ul9{font-size:30px}
      ._ca0qftgi{padding-top:8px}
      ._u5f3ftgi{padding-right:8px}
      ._n3tdftgi{padding-bottom:8px}
      ._19bvftgi{padding-left:8px}
      ._19pk1ul9{margin-top:30px}
      "
    `);
  }, 10000);

  it('extracts important styles', async () => {
    const actual = await bundle(join(fixturesPath, 'important-styles.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._4ya3eE79Ad{font-size:12!important}
      ._1UtDYzynoA{color:blue}
      "
    `);
  }, 10000);

  it('should find bindings', async () => {
    const actual = await bundle(join(fixturesPath, 'binding-not-found.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._1x1D3gfOPB{border-bottom:1px solid rgba(135,119,217,0.2)}
      ._1x1D3g1bzP{border-bottom:1px solid transparent}._0Of8r2dnbC{padding-top:0}
      ._1ZnuxbDuDI{padding-right:3rem}
      ._1wydGWdnbC{padding-bottom:0}
      ._2Zuz6QDuDI{padding-left:3rem}
      ._313842dnbC{margin-top:0}
      ._0adFHsIZbP{margin-right:auto}
      ._1DCdHidnbC{margin-bottom:0}
      ._2XsHFMIZbP{margin-left:auto}
      ._0jFU0VB34T{height:9rem}
      ._3iDTPbQ4SZ{display:flex}
      ._0hPCNLDIqT{align-items:center}
      ._42Yu6B7dHp{z-index:1}
      ._1mT5xdWVPG{position:absolute}
      ._2IhTondnbC{top:0}
      ._3OE6xYdnbC{left:0}
      ._4ApkO2dnbC{right:0}
      ._1EqgXlh2MB{max-width:140rem}
      ._1UtDYzBz3j{color:var(--_xexnhp)}
      ._00uqCY98eZ{text-decoration-color:currentColor}
      ._3xtjKNYbGa{text-decoration-line:none}
      ._0H9qDF6wH8{text-decoration-style:solid}
      ._1UtDYz98eZ{color:currentColor}
      "
    `);
  }, 10000);

  it('should handle extracted styles', async () => {
    const actual = await bundle(join(fixturesPath, 'extracted-component.tsx'));

    // Pre-built `.compiled.css` still uses legacy 9-char classes; local styles use the
    // collision-resistant 11-char hash (test default). Both formats coexist.
    expect(actual).toMatchInlineSnapshot(`
      "._19itlf8h{border:2px solid blue}._4ya3eErjyG{font-size:12px}
      ._1UtDYzynoA{color:blue}
      ._19bv1vi7{padding-left:32px}
      ._19pk1ul9{margin-top:30px}
      ._1wyb1ul9{font-size:30px}
      ._bfhk1gy6{background-color:yellow}
      ._ca0q1vi7{padding-top:32px}
      ._n3td1vi7{padding-bottom:32px}
      ._syaz13q2{color:blue}
      ._u5f31vi7{padding-right:32px}
      "
    `);
  }, 10000);

  it('preserves cssMapScoped (non-atomic) rule source order within a single file', async () => {
    const actual = await bundle(join(fixturesPath, 'css-map-scoped-styles.tsx'));

    // baseStyles (gray) is declared BEFORE overrideStyles (pink) in source.
    // The extracted CSS must preserve this order so that the cascade resolves
    // correctly when both classes are applied to the same element.
    expect(actual).toMatchInlineSnapshot(`
      ".cc-17nmfyw .editor .panel{background-color:gray}
      .cc-2ww24k .editor .panel{background-color:pink}
      "
    `);
  }, 10000);

  it('preserves cssMapScoped source order across multiple files when bundled with pre-built and local styles', async () => {
    const actual = await bundle(join(fixturesPath, 'mixed-styles.tsx'));

    // The output must:
    // 1. Place cssMapScoped (non-atomic) rules in source order at the top:
    //    - yellow (local toolbar from current file, emitted before imports are resolved)
    //    - gray (panel from `./css-map-scoped-base`, imported FIRST)
    //    - pink (panel from `./css-map-scoped-override`, imported SECOND — must come AFTER gray)
    //    (Proves cross-file non-atomic source order is preserved and mini-css-extract reversal is fixed)
    // 2. Include the pre-built `.compiled.css` atomic rules from the import
    //    (._19itlf8h, ._19bv1vi7, etc. from extracted-component.compiled.css)
    // 3. Include local atomic rules from this file (new-hash ._4ya3eEEbN9, ._1UtDYzynoA)
    // Pre-built `.compiled.css` rules remain on the legacy hash.
    expect(actual).toMatchInlineSnapshot(`
      ".cc-puo21d .editor .toolbar{background-color:yellow}
      .cc-1fqt6gw .editor .panel{background-color:gray}
      .cc-nyinpf .editor .panel{background-color:pink}
      ._19itlf8h{border:2px solid blue}._1UtDYzynoA{color:blue}
      ._4ya3eEEbN9{font-size:14px}
      ._19bv1vi7{padding-left:32px}
      ._19pk1ul9{margin-top:30px}
      ._1wyb1ul9{font-size:30px}
      ._bfhk1gy6{background-color:yellow}
      ._ca0q1vi7{padding-top:32px}
      ._n3td1vi7{padding-bottom:32px}
      ._syaz13q2{color:blue}
      ._u5f31vi7{padding-right:32px}
      "
    `);
  }, 10000);
});
