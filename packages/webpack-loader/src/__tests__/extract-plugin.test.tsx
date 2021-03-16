import { bundle } from './utils/webpack';

describe('CompiledExtractPlugin', () => {
  it('should extract styles from a single file into a style sheet', async () => {
    const actual = await bundle(require.resolve('./fixtures/single.js'));

    expect(actual['compiled-css.css']).toMatchInlineSnapshot(`
      "._1wyb1fwx{font-size:12px}
      "
    `);
  });

  it('should extract styles from multiple files into a style sheet', async () => {
    const actual = await bundle(require.resolve('./fixtures/multiple.js'));

    expect(actual['compiled-css.css']).toMatchInlineSnapshot(`
      "
      ._syaz5scu{color:red}
      ._syazmu8g{color:blueviolet}
      ._19itgh5a{border:2px solid orange}
      ._syazruxl{color:orange}
      ._f8pjruxl:focus{color:orange}
      ._f8pj1cnh:focus{color:purple}._30l31gy6:hover{color:yellow}
      ._30l313q2:hover{color:blue}
      "
    `);
  });

  it('should extract styles from an async chunk', async () => {
    const actual = await bundle(require.resolve('./fixtures/async.js'));

    // Only generate one CSS bundle
    expect(Object.keys(actual)).toMatchInlineSnapshot(`
      Array [
        "bundle.js",
        "298.bundle.js",
        "compiled-css.css",
        "298.bundle.js.LICENSE.txt",
      ]
    `);
    // Extract the styles into said bundle
    expect(actual['compiled-css.css']).toMatchInlineSnapshot(`
      "._19itgh5a{border:2px solid orange}
      ._syazruxl{color:orange}
      "
    `);
  });

  it('should throw when plugin is not configured', async () => {
    const error: Error = await bundle(require.resolve('./fixtures/single.js'), {
      disablePlugins: true,
    }).catch((err) => err);

    expect(error[0].message).toInclude(
      `You forgot to add the 'CompiledExtractPlugin' plugin (i.e \`{ plugins: [new CompiledExtractPlugin()] }\`), please read https://compiledcssinjs.com/docs/webpack-extract`
    );
  });

  it('should extract from a pre-built babel files', async () => {
    const actual = await bundle(require.resolve('./fixtures/babel.js'));

    expect(actual['compiled-css.css']).toMatchInlineSnapshot(`
      "._19pk1ul9{margin-top:30px}
      ._19bvftgi{padding-left:8px}
      ._n3tdftgi{padding-bottom:8px}
      ._u5f3ftgi{padding-right:8px}
      ._ca0qftgi{padding-top:8px}
      ._19itlf8h{border:2px solid blue}
      ._1wyb1ul9{font-size:30px}
      ._syaz13q2{color:blue}
      "
    `);
  });
});
