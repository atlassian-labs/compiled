/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require('path');

const { CompiledExtractPlugin } = require('@compiled/webpack-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

const classNameCompressionMap = require('./class-name-compression-map.json');

const extractCSS = process.env.EXTRACT_TO_CSS === 'true';

console.log('Stylesheet extraction enabled?', extractCSS);

module.exports = {
  entry: './src/index.jsx',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(custom)?[jt]sx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              configFile: false,
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
                ['@babel/preset-react', { runtime: 'automatic' }],
              ],
              plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
            },
          },
          {
            loader: '@compiled/webpack-loader',
            options: {
              extract: extractCSS,
              importReact: false,
              extensions: ['.js', '.jsx', '.ts', '.tsx', '.customjsx'],
              transformerBabelPlugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
              optimizeCss: false,
              classNameCompressionMap,
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
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
    usedExports: false,
  },
  output: {
    filename: '[name].js',
    path: join(__dirname, 'dist'),
  },
  plugins: [
    ...(extractCSS
      ? [
          new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
          new CompiledExtractPlugin({ sortShorthand: true }),
        ]
      : []),
    new HtmlWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
};
