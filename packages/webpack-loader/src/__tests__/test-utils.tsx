import { join } from 'path';

import { Volume, createFsFromVolume } from 'memfs';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack from 'webpack';

import { CompiledExtractPlugin } from '../index';
import type { ResolveOptions } from '../index';

export interface BundleOptions {
  extract?: boolean;
  disableExtractPlugin?: boolean;
  mode: 'development' | 'production';
  resolve?: ResolveOptions;
}

export function bundle(
  entry: string,
  { extract = false, disableExtractPlugin = false, mode, resolve = {} }: BundleOptions
): Promise<Record<string, string>> {
  const outputPath = join(__dirname, 'dist');
  const compiler = webpack({
    entry,
    mode,
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                configFile: false,
                presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
              },
            },
            {
              loader: '@compiled/webpack-loader',
              options: {
                extract,
                importReact: false,
                resolve,
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          sideEffects: true,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    optimization: {
      usedExports: false,
    },
    output: {
      filename: '[name].js',
      path: outputPath,
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: 'static/[name].css' }),
      ...(disableExtractPlugin ? [] : [new CompiledExtractPlugin()]),
    ],
    resolve: {
      alias: {
        'webpack-alias': join(__dirname, '..', '__fixtures__', 'lib', 'webpack-alias.ts'),
      },
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
  });

  const fs = createFsFromVolume(new Volume());
  // @ts-ignore
  compiler.outputFileSystem = fs;
  // @ts-ignore
  compiler.intermediateFileSystem = fs;

  return new Promise<Record<string, string>>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      if (stats?.hasErrors()) {
        reject(stats.toJson().errors);
        return;
      }

      const assets: Record<string, string> = {};

      Object.keys(stats?.compilation.assets || {}).map((name) => {
        const file = fs.readFileSync(join(outputPath, name), { encoding: 'utf-8' });
        assets[name] = file as string;
      });

      resolve(assets);
    });
  });
}
