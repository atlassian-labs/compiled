# @compiled/swc-plugin

> A high-performance SWC plugin for [Compiled CSS-in-JS](https://compiledcssinjs.com)

This package provides a SWC plugin that transforms Compiled CSS-in-JS components at build time, offering significant performance improvements over the Babel plugin equivalent.

## Installation

```bash
npm install @compiled/swc-plugin
# or
yarn add @compiled/swc-plugin
```

## Usage

Add the plugin to your SWC configuration:

### .swcrc

```json
{
  "jsc": {
    "experimental": {
      "plugins": [["@compiled/swc-plugin", {}]]
    }
  }
}
```

### Next.js

```javascript
// next.config.js
module.exports = {
  experimental: {
    swcPlugins: [['@compiled/swc-plugin', {}]],
  },
};
```

### Webpack with swc-loader

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|ts|jsx|tsx)$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              experimental: {
                plugins: [['@compiled/swc-plugin', {}]],
              },
            },
          },
        },
      },
    ],
  },
};
```

## Supported Features

- ✅ `<ClassNames>` component transformation
- ✅ `styled.*` component transformation
- ✅ `css` prop transformation
- ✅ `cssMap` object resolution
- ✅ `keyframes` animation support
- ✅ Import resolution and optimization
- ✅ Automatic runtime injection

## Configuration Options

```typescript
interface CompiledOptions {
  /** Custom import source for runtime (default: "@compiled/react") */
  importSrc?: string;

  /** Enable/disable specific transformations */
  transformations?: {
    classNames?: boolean;
    styled?: boolean;
    css?: boolean;
    cssMap?: boolean;
    keyframes?: boolean;
  };
}
```

## Performance

This SWC plugin offers significant performance improvements over the Babel equivalent:

- **~10x faster** compilation times
- **Lower memory usage**
- **Parallel processing** support
- **WASM-based** for consistent performance across platforms

## Examples

### ClassNames Component

```jsx
// Input
<ClassNames>
  {({ css }) => (
    <div className={css({ color: 'red', fontSize: 12 })}>
      Hello World
    </div>
  )}
</ClassNames>

// Output
<CC>
  <CS>{["._syaz13q2{color:red;}", "._1wyb1fwx{font-size:12px;}"]}</CS>
  <div className={ax(["_syaz13q2", "_1wyb1fwx"])}>
    Hello World
  </div>
</CC>
```

### Styled Components

```jsx
// Input
const StyledDiv = styled.div`
  color: blue;
  font-size: 14px;
`;

// Output
const StyledDiv = forwardRef(({ as: C = 'div', ...props }, ref) => (
  <CC>
    <CS>{['._syaz1d4w{color:blue;}', '._1wyba8vr{font-size:14px;}']}</CS>
    <C {...props} className={ax(['_syaz1d4w', '_1wyba8vr', props.className])} ref={ref} />
  </CC>
));
```

## Requirements

- Node.js >= 16.0.0
- SWC >= 1.3.0
- React >= 16.8.0

## License

Apache-2.0 © [Atlassian](https://github.com/atlassian-labs)
