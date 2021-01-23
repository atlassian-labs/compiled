import { Transformer } from '@parcel/plugin';
import semver from 'semver';

/**
 * Compiled Transformer
 *
 * Should run before any other Babel transformers.
 */
export default new Transformer({
  canReuseAST({ ast }: any) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async transform({ asset, ast, resolve }: any) {
    if (ast) {
      throw new Error('@compiled/parcel-transformer should run before all other transformers.');
    }

    if (asset.isSource) {
      console.log('bundling', asset.filePath);

      asset.meta.babelPlugins = [['@compiled/babel-plugin', { cache: false }]];

      if (asset.filePath.endsWith('examples/packages/parcel/src/app.js')) {
        console.log('ADDING HARDCODED ASSET');
        await asset.addIncludedFile(
          await resolve(
            '/Users/madou/projects/compiled/examples/packages/parcel/src/module.js',
            './module.js'
          )
        );
      }
    }

    return [asset];
  },
});
