# @compiled/parcel-transformer-external

Parcel plugin for Compiled which collects extracted styles from node_modules. This is required when `@compiled/babel-plugin-strip-runtime` is configured with `extractStylesToDirectory` which generates code like the following:

```js
require('./index.compiled.css');
```

See the [@compiled/babel-plugin-strip-runtime docs](https://compiledcssinjs.com/docs/pkg-babel-plugin-strip-runtime) for more details.

## Installation

```bash
npm i @compiled/parcel-transformer-external
```

## Usage

Detailed docs and example usage can be [found on the documentation website](https://compiledcssinjs.com/docs/pkg-parcel-transformer-external).
