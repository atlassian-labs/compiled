# @compiled/webpack-loader/css-loader

## What's `extract.css`

It is a place holder CSS file we use for extraction.
It's used for two reasons:

1. thread safe collection of styles
1. caching -- resulting in faster bundles

You can find it being used here `packages/webpack-loader/src/compiled-loader.tsx`.
