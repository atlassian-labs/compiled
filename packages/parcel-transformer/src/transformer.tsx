import { Transformer } from '@parcel/plugin';
import type { PluginOptions } from '@compiled/babel-plugin';
import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';

type UserlandOpts = Omit<PluginOptions, 'cache' | 'onIncludedFile'>;

const configFiles = [
  '.compiledcssrc',
  '.compiledcssrc.json',
  'compiledcss.js',
  'compiledcss.config.js',
];

/**
 * Compiled parcel transformer.
 */
export default new Transformer<UserlandOpts>({
  async loadConfig({ config }) {
    const conf = await config.getConfig(configFiles, {
      packageKey: '@compiled/parcel-transformer',
    });

    const contents: UserlandOpts = {};

    if (conf) {
      config.shouldInvalidateOnStartup();
      Object.assign(contents, conf.contents);
    }

    // We always set a result so it's only evaluated once.
    config.setResult(contents);
  },

  canReuseAST() {
    // Compiled should run before any other JS transformer.
    return false;
  },

  async parse({ asset }) {
    if (!asset.isSource) {
      return undefined;
    }

    const code = await asset.getCode();
    if (code.indexOf('@compiled/react') === -1) {
      // We only want to parse files that are actually using Compiled.
      // For everything else we bail out.
      return undefined;
    }

    const ast = await parseAsync(code, {
      filename: asset.filePath,
      caller: { name: 'compiled' },
    });

    return ast;
  },

  async transform({ asset, config }) {
    const ast = await asset.getAST();
    if (!asset.isSource || !ast) {
      // We will only recieve ASTs for assets we're interested in.
      // Since this is undefined (or in node modules) we aren't interested in it.
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
      sourceMaps: true,
      plugins: [
        [
          '@compiled/babel-plugin',
          {
            ...config,
            onIncludedFile: (file: string) => includedFiles.push(file),
            cache: 'single-pass',
          },
        ],
      ],
      caller: {
        name: 'compiled',
      },
    });

    includedFiles.forEach((file) => {
      // Included files are those which have been statically evaluated into this asset.
      // This tells parcel that if any of those files change this asset should be transformed
      // again.
      asset.addIncludedFile(file);
    });

    if (result?.ast) {
      asset.setAST({
        // TODO: Currently if we set this as `'babel'` the babel transformer blows up.
        // Let's figure out what we can do to reuse it.
        type: 'compiled',
        version: '0.0.0',
        program: result.ast,
      });
    }

    return [asset];
  },

  generate({ ast, asset }) {
    // TODO: We're using babels standard generator. Internally parcel does some hacks in
    // the official Babel transformer to make it faster - using ASTree directly.
    // Perhaps we should do the same thing.
    const { code, map } = generate(ast.program, {
      filename: asset.filePath,
    });

    return { content: code, map };
  },
});
