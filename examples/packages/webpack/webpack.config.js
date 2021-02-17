/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { CompiledExtractPlugin } = require('@compiled/webpack-loader');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.json', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          { loader: 'babel-loader' },
          {
            loader: '@compiled/webpack-loader',
            options: {
              importReact: false,
              extract: true,
            },
          },
        ],
      },
      {
        include: /@private\/babel-component/,
        use: {
          loader: '@compiled/webpack-loader',
          options: {
            extract: true,
          },
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new CompiledExtractPlugin({ filename: '[contenthash].css' }),
  ],
};
