import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';
import type { PluginOptions } from '@compiled/babel-plugin';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';

type UserlandOpts = Omit<PluginOptions, 'cache' | 'onIncludedFiles'>;

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
  canReuseAST() {
    // Compiled should run before any other JS transformer.
    return false;
  },

  async generate({ asset, ast }) {
    // TODO: We're using babels standard generator. Internally parcel does some hacks in
    // the official Babel transformer to make it faster - using ASTree directly.
    // Perhaps we should do the same thing.
    const { code, map: babelMap } = generate(ast.program, {
      filename: asset.filePath,
      sourceFileName: asset.filePath,
      sourceMaps: true,
    });

    return {
      content: code,
      map: babelMap ? new SourceMap().addVLQMap(babelMap) : null,
    };
  },

  async loadConfig({ config }) {
    const conf = await config.getConfig(configFiles, {
      packageKey: '@compiled/parcel-transformer',
    });

    const contents: UserlandOpts = {};

    if (conf) {
      config.invalidateOnStartup();
      Object.assign(contents, conf.contents);
    }

    return contents;
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

    const program = await parseAsync(code, {
      caller: { name: 'compiled' },
      filename: asset.filePath,
      rootMode: 'upward-optional',
    });

    return {
      program,
      type: 'babel',
      version: '7.0.0',
    };
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
      ast: true,
      babelrc: false,
      caller: {
        name: 'compiled',
      },
      code: false,
      configFile: false,
      filename: asset.filePath,
      plugins: [
        [
          '@compiled/babel-plugin',
          {
            ...config,
            cache: 'single-pass',
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
          },
        ],
      ],
      sourceMaps: true,
    });

    includedFiles.forEach((file) => {
      // Included files are those which have been statically evaluated into this asset.
      // This tells parcel that if any of those files change this asset should be transformed
      // again.
      asset.invalidateOnFileChange(file);
    });

    if (result?.ast) {
      asset.setAST({
        program: result.ast,
        // TODO: Currently if we set this as `'babel'` the babel transformer blows up.
        // Let's figure out what we can do to reuse it.
        type: 'compiled',
        version: '0.0.0',
      });
    }

    return [asset];
  },
});
