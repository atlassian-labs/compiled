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
      "._1wybdlk8{font-size:14px}
      ._syaz13q2{color:blue}
      "
    `);
  }, 10000);

  it('extracts styles imported through a relative path', async () => {
    const actual = await bundle(join(fixturesPath, 'relative-styles.tsx'));

    // This should not contain any styles from the unused relative import ./common/css-prop, which includes
    // {color:coral} or {border:2px solid coral}
    expect(actual).toMatchInlineSnapshot(`
      "
      ._syaz5scu{color:red}
      ._syazmu8g{color:blueviolet}
      ._f8pjruxl:focus{color:orange}
      ._f8pj1cnh:focus{color:purple}._30l31gy6:hover{color:yellow}
      ._30l313q2:hover{color:blue}
      "
    `);
  }, 10000);

  it('extracts styles imported through a webpack alias', async () => {
    const assets = await bundle(join(fixturesPath, 'webpack-alias.tsx'));

    expect(assets).toMatchInlineSnapshot(`
      "._syaz13q2{color:blue}
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
      "._syaz1if8{color:indigo}
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
      "._19it1e35{border:2px solid coral}
      ._syaz1vyr{color:coral}
      "
    `);
  }, 10000);

  it('extracts styles from a pre-built babel files', async () => {
    const actual = await bundle(join(fixturesPath, 'babel.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._19pk1ul9{margin-top:30px}
      ._19bvftgi{padding-left:8px}
      ._n3tdftgi{padding-bottom:8px}
      ._u5f3ftgi{padding-right:8px}
      ._ca0qftgi{padding-top:8px}
      ._19itlf8h{border:2px solid blue}
      ._1wyb1ul9{font-size:30px}
      ._syaz13q2{color:blue}
      "
    `);
  }, 10000);

  it('extracts important styles', async () => {
    const actual = await bundle(join(fixturesPath, 'important-styles.tsx'));

    expect(actual).toMatchInlineSnapshot(`
        "._syaz13q2{color:blue}
        ._1wybc038{font-size:12!important}
        "
      `);
  }, 10000);

  it('should find bindings', async () => {
    const actual = await bundle(join(fixturesPath, 'binding-not-found.tsx'));

    expect(actual).toMatchInlineSnapshot(`
      "._syaz1r31{color:currentColor}
      ._ajmmnqa1{text-decoration-style:solid}
      ._1hmsglyw{text-decoration-line:none}
      ._4bfu1r31{text-decoration-color:currentColor}
      ._n7zl17qw{border-bottom:1px solid transparent}
      ._n7zl1l01{border-bottom:1px solid rgba(135,119,217,0.2)}
      ._syaz1cj8{color:var(--_xexnhp)}
      ._p12f1us4{max-width:140rem}
      ._18u01wug{margin-left:auto}
      ._otyridpf{margin-bottom:0}
      ._2hwx1wug{margin-right:auto}
      ._19pkidpf{margin-top:0}
      ._1xi2idpf{right:0}
      ._1ltvidpf{left:0}
      ._154iidpf{top:0}
      ._kqswstnw{position:absolute}
      ._1pbykb7n{z-index:1}
      ._19bv1wto{padding-left:3rem}
      ._n3tdidpf{padding-bottom:0}
      ._u5f31wto{padding-right:3rem}
      ._ca0qidpf{padding-top:0}
      ._4cvr1h6o{align-items:center}
      ._1e0c1txw{display:flex}
      ._4t3i1jdh{height:9rem}
      "
    `);
  }, 10000);
});
