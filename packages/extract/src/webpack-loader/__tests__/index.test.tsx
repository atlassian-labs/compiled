import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import ExtractPlugin from '../index';

describe('extract webpack plugin', () => {
  it('should do something', (cb) => {
    const compiler = webpack({
      entry: __dirname + '/fixtures/one.js',
      module: {
        rules: [
          {
            test: /.+\.js$/,
            use: 'babel-loader',
          },
        ],
      },
      plugins: [new ExtractPlugin()],
    });

    const fs = createFsFromVolume(new Volume({}));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    compiler.outputFileSystem = fs;

    compiler.run((error, result) => {
      if (error) {
        console.log(error);
        cb(error);
        return;
      }

      console.log(result);

      cb();
    });
  });
});
