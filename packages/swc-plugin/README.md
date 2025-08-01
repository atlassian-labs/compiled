# @compiled/swc-plugin

A SWC plugin for Compiled CSS transformations.

## Current Functionality

This plugin currently implements a basic transformation as a proof of concept:
- Replaces the left operand of strict equality (`===`) expressions with the identifier `kdy1`

## Development

### Building the Plugin

To build the WASM plugin:

```bash
cargo build-wasip1 --release
```

This will generate the WASM file at `target/wasm32-wasip1/release/swc_plugin_compiled.wasm`.

### Running Tests

First, make sure to build the plugin:

```bash
cargo build-wasip1 --release
```

Then run the JavaScript tests:

```bash
npm test
# or
yarn test
```

### Test Examples

The plugin transforms code like this:

**Input:**
```javascript
if (user === "admin") {
  return status === "active";
}
```

**Output:**
```javascript
if (kdy1 === "admin") {
  return kdy1 === "active";
}
```

## Future Implementation

This plugin is currently a basic example. Future development will implement:
- CSS-in-JS transformation (similar to the Babel plugin)
- Styled component compilation
- CSS extraction and optimization
- Full Compiled CSS feature parity

## Requirements

- Rust toolchain with `wasm32-wasip1` target
- Node.js for running tests
- SWC core for plugin integration