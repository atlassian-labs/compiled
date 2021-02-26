import { Transformer } from '@parcel/plugin';
import semver from 'semver';
import compiledBabelPlugin from '@compiled/babel-plugin';
import { parseAsync, transformFromAstAsync } from '@babel/core';
import { generate } from '@parcel/babel-ast-utils';

/**
 * Compiled parcel transformer.
 */
export default new Transformer({
  canReuseAST({ ast }: any) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async parse({ asset }: any) {
    const code = await asset.getCode();

    const ast = await parseAsync(code, {
      filename: asset.filePath,
      caller: { name: 'compiled' },
      plugins: ['@babel/plugin-syntax-jsx'],
    });

    return ast;
  },

  async transform({ asset, ast }: any) {
    if (asset.isSource) {
      const includedFiles: string[] = [];

      const result = await transformFromAstAsync(
        ast.program,
        asset.isASTDirty() ? undefined : await asset.getCode(),
        {
          code: false,
          ast: true,
          filename: asset.filePath,
          babelrc: false,
          configFile: false,
          plugins: [
            [compiledBabelPlugin, { onIncludedFile: (file: string) => includedFiles.push(file) }],
          ],
          caller: {
            name: 'compiled',
          },
        }
      );

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
    }

    return [asset];
  },

  async generate({ asset, ast, options }: any) {
    return generate({ asset, ast, options });
  },
});
