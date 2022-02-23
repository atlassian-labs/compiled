import { parseAsync, transformFromAstAsync } from '@babel/core';
import generate from '@babel/generator';
import { toBoolean } from '@compiled/utils';
import { Transformer } from '@parcel/plugin';
import SourceMap from '@parcel/source-map';

import type { ParcelTransformerOpts } from './types';

const configFiles = [
  '.compiledcssrc',
  '.compiledcssrc.json',
  'compiledcss.js',
  'compiledcss.config.js',
];

/**
 * Compiled parcel transformer.
 */
export default new Transformer<ParcelTransformerOpts>({
  async loadConfig({ config }) {
    const conf = await config.getConfig(configFiles, {
      packageKey: '@compiled/parcel-transformer',
    });

    const contents = {
      extract: false,
      importReact: true,
    };

    if (conf) {
      config.invalidateOnStartup();
      Object.assign(contents, conf.contents);
    }

    return contents;
  },

  canReuseAST() {
    // Compiled should run before any other JS transformer.
    return false;
  },

  async parse({ asset, config }) {
    if (!asset.isSource && !config.extract) {
      // Only parse source (pre-built code should already have been baked) or if stylesheet extraction is enabled
      return undefined;
    }

    const code = await asset.getCode();
    if (code.indexOf('@compiled/react') === -1) {
      // We only want to parse files that are actually using Compiled.
      // For everything else we bail out.
      return undefined;
    }

    const program = await parseAsync(code, {
      filename: asset.filePath,
      caller: { name: 'compiled' },
      rootMode: 'upward-optional',
    });

    return {
      type: 'babel',
      version: '7.0.0',
      program,
    };
  },

  async transform({ asset, config }) {
    const ast = await asset.getAST();
    if (!ast) {
      // We will only receive ASTs for assets we're interested in.
      // Since this is undefined (or in node modules) we aren't interested in it.
      return [asset];
    }

    const includedFiles: string[] = [];
    const foundCSSRules: string[] = [];
    const code = asset.isASTDirty() ? undefined : await asset.getCode();

    const result = await transformFromAstAsync(ast.program, code, {
      code: true,
      ast: false,
      filename: asset.filePath,
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      plugins: [
        asset.isSource && [
          '@compiled/babel-plugin',
          {
            ...config,
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
            cache: 'single-pass',
          },
        ],
        config.extract && [
          '@compiled/babel-plugin-strip-runtime',
          {
            onFoundStyleRules: (styles: string[]) => foundCSSRules.push(...styles),
          },
        ],
      ].filter(toBoolean),
      caller: {
        name: 'compiled',
      },
    });

    let output = result?.code || '';

    includedFiles.forEach((file) => {
      // Included files are those which have been statically evaluated into this asset.
      // This tells parcel that if any of those files change this asset should be transformed
      // again.
      asset.invalidateOnFileChange(file);
    });

    if (config.extract && foundCSSRules.length) {
      for (const rule of foundCSSRules) {
        // Build imports with css to be resolved into CSS by `@compiled/parcel-resolver`
        const params = encodeURIComponent(rule);
        output = `\nimport 'compiled-css!${params}';\n${output}`;
      }
    }

    asset.setCode(output);

    return [asset];
  },

  async generate({ asset, ast }) {
    // TODO: We're using babels standard generator. Internally parcel does some hacks in
    // the official Babel transformer to make it faster - using ASTree directly.
    // Perhaps we should do the same thing.
    const { code, map: babelMap } = generate(ast.program, {
      filename: asset.filePath,
      sourceMaps: true,
      sourceFileName: asset.filePath,
    });

    return {
      content: code,
      map: babelMap ? new SourceMap().addVLQMap(babelMap) : null,
    };
  },
});
