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

  async transform({ asset, ast }: any) {
    if (ast) {
      throw new Error('@compiled/parcel-transformer should run before all other transformers.');
    }

    if (asset.isSource) {
      asset.meta.babelPlugins = ['@compiled/babel-plugin'];
    }

    return [asset];
  },
});
