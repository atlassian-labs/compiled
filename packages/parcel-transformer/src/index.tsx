import { Transformer } from '@parcel/plugin';
import semver from 'semver';
import compiledBabelPlugin from '@compiled/babel-plugin';
import { transformAsync } from '@babel/core';
import { generate, babelErrorEnhancer } from '@parcel/babel-ast-utils';

/**
 * Compiled parcel transformer.
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
      try {
        const includedFiles: string[] = [];
        const result = await transformAsync(asset.getCode(), {
          code: false,
          ast: true,
          filename: asset.filePath,
          babelrc: false,
          configFile: false,
          plugins: [
            [compiledBabelPlugin, { onIncludedFile: (file: string) => includedFiles.push(file) }],
          ],
        });

        includedFiles.forEach((file) => {
          asset.addIncludedFile(file);
        });

        if (result?.ast) {
          asset.setAST({
            type: 'babel',
            version: '7.0.0',
            program: result.ast,
          });
        }
      } catch (e) {
        throw await babelErrorEnhancer(e);
      }
    }

    return [asset];
  },

  async generate({ asset, ast, options }: any) {
    return generate({ asset, ast, options });
  },
});
