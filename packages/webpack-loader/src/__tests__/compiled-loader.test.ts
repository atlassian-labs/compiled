/**
 * @jest-environment node
 */

import { join } from 'path';

import { bundle as bundleEntry } from './test-utils';
import type { BundleOptions } from './test-utils';

// We are testing in both modes, because the initial custom resolver implementation (i.e. this.getResolve) only works
// in production
describe.each<'development' | 'production'>(['development', 'production'])(
  'webpack loader in %s mode',
  (mode) => {
    const fixturesPath = join(__dirname, '..', '__fixtures__');

    const bundle = (entry: string, options: Omit<BundleOptions, 'mode'> = {}) =>
      bundleEntry(entry, {
        ...options,
        mode,
      });

    it('does not transform files that do not contain styles', async () => {
      const assets = await bundle(join(fixturesPath, 'no-compiled-styles.ts'));

      if (mode === 'development') {
        expect(assets['main.js']).toInclude("console.log('Hello world!');");
      } else {
        expect(assets['main.js']).toMatchInlineSnapshot(`"console.log("Hello world!");"`);
      }
    });

    it('does not transform files that do not contain @compiled/react', async () => {
      const assets = await bundle(join(fixturesPath, 'non-compiled-import-source.tsx'));

      if (mode === 'development') {
        // This appears to just default to eval mode—I can't test much about it…
        expect(assets['main.js']).toInclude('eval()');
        expect(assets['main.js']).toInclude('React.createElement');
        expect(assets['main.js']).not.toMatch(/\{[\s]*margin(-[a-z]+)?:[\s]*0[\s]*\}/);
        expect(assets['main.js']).toInclude(
          '__webpack_require__("./packages/webpack-loader/src/__fixtures__/non-compiled-import-source.tsx");'
        );
      } else {
        expect(assets['main.js']).toMatch(
          /@compiled\/react[\\n\s]+Code was executed when it shouldn't have\./
        );
        expect(assets['main.js']).toInclude('{margin:0}');
      }
    });

    it('transforms a file that does not contain @compiled/react, but contains an importSource', async () => {
      const assets = await bundle(join(fixturesPath, 'non-compiled-import-source.tsx'), {
        importSources: ['@other/css'],
      });

      expect(assets['main.js']).not.toInclude('{margin:0}');
      expect(assets['main.js']).toIncludeMultiple([
        '._313842dnbC{margin-top:0}',
        '._0adFHsdnbC{margin-right:0}',
        '._1DCdHidnbC{margin-bottom:0}',
        '._2XsHFMdnbC{margin-left:0}',
      ]);
    });

    it('transforms local styles', async () => {
      const assets = await bundle(join(fixturesPath, 'local-styles.tsx'));

      expect(assets['main.js']).toIncludeMultiple([
        '._4ya3eEEbN9{font-size:14px}',
        '._1UtDYzynoA{color:blue}',
      ]);
    });

    // CLEANUP: remove when collisionResistantHash becomes the shipped default
    it('forwards collisionResistantHash: false (legacy hash) to the babel plugin', async () => {
      const assets = await bundle(join(fixturesPath, 'local-styles.tsx'), {
        collisionResistantHash: false,
      });

      expect(assets['main.js']).toIncludeMultiple([
        '._1wybdlk8{font-size:14px}',
        '._syaz13q2{color:blue}',
      ]);
      expect(assets['main.js']).not.toInclude('._4ya3eEEbN9{font-size:14px}');
      expect(assets['main.js']).not.toInclude('._1UtDYzynoA{color:blue}');
    });

    it('transforms styles imported through a relative import', async () => {
      const assets = await bundle(join(fixturesPath, 'relative-styles.tsx'));

      expect(assets['main.js']).toIncludeMultiple([
        '._1UtDYzGowl{color:red}',
        '._1UtDYzsHik{color:blueviolet}',
        '._10n1R50axx:focus{color:orange}',
        '._10n1R55CUP:focus{color:purple}',
        '._0clgaMFQV5:hover{color:yellow}',
        '._0clgaMynoA:hover{color:blue}',
      ]);

      // not.toIncludeMultiple does not work as intended
      expect(assets['main.js']).not.toInclude('{border:2px solid coral}');
      expect(assets['main.js']).not.toInclude('{color:coral}');
    });

    it('transforms styles imported through a webpack alias', async () => {
      const assets = await bundle(join(fixturesPath, 'webpack-alias.tsx'));

      expect(assets['main.js']).toInclude('._1UtDYzynoA{color:blue}');
    });

    it('transforms styles imported through an overridden resolve configuration', async () => {
      const assets = await bundle(join(fixturesPath, 'loader-alias.tsx'), {
        resolve: {
          // This alias will be put into the compiled plugin options, but not the webpack resolve configuration
          alias: {
            'loader-alias': join(fixturesPath, 'lib', 'loader-alias.ts'),
          },
        },
      });

      expect(assets['main.js']).toInclude('._1UtDYzHKf3{color:indigo}');
    });

    it('transforms styles imported through an overridden resolver', async () => {
      const assets = await bundle(join(fixturesPath, 'custom-resolver.tsx'), {
        resolver: '@compiled-private/resolver-webpack',
      });

      expect(assets['main.js']).toInclude('._1UtDYzAaGC{color:very-very red color');
    });

    it('fails when using unrecognised compiled syntax', async () => {
      await expect(bundle(join(fixturesPath, 'compiled-error.tsx'))).rejects.toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            'This BooleanLiteral was unable to have its styles extracted — try to define them statically using Compiled APIs instead'
          ),
        }),
      ]);
    });
  }
);
