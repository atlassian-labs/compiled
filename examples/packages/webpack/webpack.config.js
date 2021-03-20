/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CompiledExtractPlugin } = require('@compiled/webpack-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const extractCSS = process.env.EXTRACT_TO_CSS === 'true';

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
              extract: extractCSS,
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [extractCSS ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
      },
    ].filter(Boolean),
  },
  plugins: [
    extractCSS && new MiniCssExtractPlugin({ filename: '[name].css' }),
    extractCSS && new CompiledExtractPlugin(),
    new HtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean),
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
};
