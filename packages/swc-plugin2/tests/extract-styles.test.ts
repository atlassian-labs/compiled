const fs = require('fs');
const path = require('path');

const { transform } = require('./swc-output');

describe('swc-plugin2 with stylesheet extraction (extractStylesToDirectory)', () => {
  const code = `
    import '@compiled/react';

    const Component = () => (
      <div css={{ fontSize: 12, color: 'blue' }}>
        hello world
      </div>
    );
  `;

  it('adds styles to directory and injects import', async () => {
    const actual = await transform(code, {
      extract: true,
      extractStylesToDirectory: { source: 'src/', dest: 'dist/' },
      forceEnable: true,
    });

    expect(actual).toContain('import "./test.compiled.css"');
    const cssPath = path.join(process.cwd(), 'dist', 'test.compiled.css');
    console.log("CHECKING CSS PATH", cssPath);
    expect(fs.existsSync(cssPath)).toBe(true);
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toMatch(/\._[A-Za-z0-9_-]+\{font-size:12px\}/);
    expect(css).toMatch(/\._[A-Za-z0-9_-]+\{color:blue\}/);
  });

  it('errors when source directory is not found', async () => {
    await expect(
      transform(code, {
        extract: true,
        extractStylesToDirectory: { source: 'not-existing-src/', dest: 'dist/' },
        forceEnable: true,
      })
    ).rejects.toThrow();
  });
});


