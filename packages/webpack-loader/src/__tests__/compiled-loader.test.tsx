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

    it('does not transform files that do not contain @compiled/react', async () => {
      const assets = await bundle(join(fixturesPath, 'no-compiled-styles.ts'));

      if (mode === 'development') {
        expect(assets['main.js']).toInclude("console.log('Hello world!');");
      } else {
        expect(assets['main.js']).toMatchInlineSnapshot(`"console.log(\\"Hello world!\\");"`);
      }
    });

    it('transforms local styles', async () => {
      const assets = await bundle(join(fixturesPath, 'local-styles.tsx'));

      expect(assets['main.js']).toIncludeMultiple([
        '._1wybdlk8{font-size:14px}',
        '._syaz13q2{color:blue}',
      ]);
    });

    it('transforms styles imported through a relative import', async () => {
      const assets = await bundle(join(fixturesPath, 'relative-styles.tsx'));

      expect(assets['main.js']).toIncludeMultiple([
        '._syaz5scu{color:red}',
        '._syazmu8g{color:blueviolet}',
        '._f8pjruxl:focus{color:orange}',
        '._f8pj1cnh:focus{color:purple}',
        '._30l31gy6:hover{color:yellow}',
        '._30l313q2:hover{color:blue}',
      ]);

      // not.toIncludeMultiple does not work as intended
      expect(assets['main.js']).not.toInclude('{border:2px solid coral}');
      expect(assets['main.js']).not.toInclude('{color:coral}');
    });

    it('transforms styles imported through a webpack alias', async () => {
      const assets = await bundle(join(fixturesPath, 'webpack-alias.tsx'));

      expect(assets['main.js']).toInclude('._syaz13q2{color:blue}');
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

      expect(assets['main.js']).toInclude('._syaz1if8{color:indigo}');
    });

    it('fails when using unrecognised compiled syntax', async () => {
      await expect(bundle(join(fixturesPath, 'compiled-error.tsx'))).rejects.toEqual([
        expect.objectContaining({
          message: expect.stringContaining(
            "BooleanLiteral isn't a supported CSS type - try using an object or string"
          ),
        }),
      ]);
    });
  }
);
