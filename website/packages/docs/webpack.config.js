const path = require('path');

const { CompiledExtractPlugin } = require('@compiled/webpack-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const frontmatter = require('remark-frontmatter');
const webpack = require('webpack');

const exportMeta = require('./src/utils/export-meta');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: { bundle: './src/index.tsx' },

  devServer: {
    historyApiFallback: {
      rewrites: [{ from: /./, to: '/docs/index.html' }],
    },
  },

  output: {
    publicPath: '/docs/',
    path: path.resolve(__dirname, '../../dist/docs'),
    filename: isProduction ? '[chunkhash].js' : '[name].js',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.json', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.mdx?$/,
        use: [
          { loader: 'babel-loader', options: { rootMode: 'upward-optional' } },
          {
            loader: '@mdx-js/loader',
            options: { remarkPlugins: [frontmatter, exportMeta] },
          },
        ],
      },
      {
        test: /\.(t|j)sx?$/,
        include: /@compiled|packages/,
        use: [
          { loader: 'babel-loader', options: { rootMode: 'upward-optional' } },
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
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: isProduction ? '[chunkhash].[name].css' : '[name].css',
    }),
    new CompiledExtractPlugin(),
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    !isProduction && new webpack.HotModuleReplacementPlugin(),
  ].filter(Boolean),

  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
};
