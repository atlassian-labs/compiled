# @compiled/webpack-loader/css-loader

## What's `extract.css`

We use `extract.css` for two reasons:

1. as a stub in the `compiled-loader.tsx` module as a communication channel to pass information to the `css-loader.tsx` module
1. to tell webpack that this is CSS so it can naturally flow through all other CSS loaders
