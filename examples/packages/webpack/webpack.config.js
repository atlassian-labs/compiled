/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CompiledCSSSortingPlugin } = require('@compiled/webpack-loader');

const extractCss = process.env.EXTRACT_TO_CSS === 'true';

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
              extract: extractCss,
            },
          },
        ],
      },
      extractCss && {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ].filter(Boolean),
  },
  plugins: [
    extractCss && new MiniCssExtractPlugin(),
    extractCss && new CompiledCSSSortingPlugin(),
    new HtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean),
};
