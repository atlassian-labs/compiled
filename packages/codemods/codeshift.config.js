module.exports = {
  presets: {
    'emotion-to-compiled': require.resolve('./src/transforms/emotion-to-compiled'),
    'styled-components-to-compiled': require.resolve(
      './src/transforms/styled-components-to-compiled'
    ),
    'styled-components-inner-ref-to-ref': require.resolve(
      './src/transforms/styled-components-inner-ref-to-ref'
    ),
  },
};
