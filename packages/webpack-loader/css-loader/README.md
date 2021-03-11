# @compiled/webpack-loader/css-loader

## What's `extract.css`

We use `extract.css` for two reasons:

1. caching -- resulting in faster re-bundles
1. thread safe communication channel

You can find it being used here `packages/webpack-loader/src/compiled-loader.tsx`.
