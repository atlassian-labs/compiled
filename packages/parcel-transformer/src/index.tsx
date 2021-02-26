import { Transformer } from '@parcel/plugin';
import semver from 'semver';
import compiledBabelPlugin from '@compiled/babel-plugin';
import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';

/**
 * Compiled parcel transformer.
 */
export default new Transformer({
  canReuseAST({ ast }: any) {
    return ast.type === 'babel' && semver.satisfies(ast.version, '^7.0.0');
  },

  async parse({ asset }: any) {
    const code = await asset.getCode();
    if (code.indexOf('@compiled/react') === -1) {
      return undefined;
    }

    const ast = await parseAsync(code, {
      filename: asset.filePath,
      caller: { name: 'compiled' },
      plugins: ['@babel/plugin-syntax-jsx'],
    });

    return ast;
  },

  async transform({ asset, ast }: any) {
    if (!asset.isSource || !ast) {
      // We're not interested in this asset.
      return [asset];
    }

    const includedFiles: string[] = [];
    const code = asset.isASTDirty() ? undefined : await asset.getCode();

    const result = await transformFromAstAsync(ast.program, code, {
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
    });

    includedFiles.forEach((file) => {
      asset.addIncludedFile(file);
    });

    if (result?.ast) {
      asset.setAST({
        type: 'compiled',
        version: '0.0.0',
        program: result.ast,
      });
    }

    return [asset];
  },

  generate({ ast }: any) {
    const { code, map } = generate(ast.program, {});

    return { code, map };
  },
});
