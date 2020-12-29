import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import * as realFs from 'fs';
import { Union } from 'unionfs';
import ExtractPlugin from '../../index';

const compiler = webpack({
  entry: './compiled-test.js',
  output: {
    path: '/',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [new ExtractPlugin()],
  optimization: {
    // Don't minimize
    minimize: false,

    // Move all boilerplate code to other chunks so we get better visibility of what's happening.
    chunkIds: 'named',
    runtimeChunk: true,
    concatenateModules: true,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
        },
        vendor: {
          test: /node_modules|packages\/react/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          enforce: true,
        },
      },
    },
  },
});

export const bundle = (file: TemplateStringsArray): Promise<string> => {
  const inMemoryFs = createFsFromVolume(Volume.fromJSON({ './compiled-test.js': file[0] }));
  const unionFs = new Union();
  unionFs.use(inMemoryFs as any).use(realFs);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  compiler.outputFileSystem = inMemoryFs;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  compiler.inputFileSystem = unionFs;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  compiler.intermediateFileSystem = inMemoryFs;

  return new Promise<string>((resolve, reject) => {
    compiler.run((error, result) => {
      if (error) {
        reject(error);
        return;
      }

      if (result && result.hasErrors()) {
        reject(
          new Error(
            result.toString({
              errorDetails: true,
            })
          )
        );
        return;
      }

      resolve(inMemoryFs.readFileSync('/main.js', 'utf8') as string);
    });
  });
};
