require('ts-node').register({
  experimentalResolver: true,
  transpileOnly: true,
});
require('tsconfig-paths/register');

// Vite 5 uses the Node 18+ crypto.getRandomValues alias. This repository also
// validates Node 16, where the same API is available through crypto.webcrypto.
const nodeCrypto = require('crypto');
if (!nodeCrypto.getRandomValues && nodeCrypto.webcrypto?.getRandomValues) {
  nodeCrypto.getRandomValues = nodeCrypto.webcrypto.getRandomValues.bind(nodeCrypto.webcrypto);
}

const fs = require('fs');
const os = require('os');
const { join } = require('path');
const { build } = require('vite');

const compiledVitePlugin = require('../../../index').default;

const font = '._11c8wadc{font:var(--ds-font-body-small)}';
const fontWeight = '._k48pwu06{font-weight:var(--ds-font-weight-bold,653)}';
// Authored CSS that Compiled's sort() would reorder (padding is a shorthand of padding-left).
const authored = '.a{padding-left:4px}.a{padding:0}';

const scenarios = {
  default: { options: {}, output: {} },
  'compiled-only': { options: { sortOnlyCompiledCss: true }, output: {} },
  'user-manual-chunks': {
    options: { sortOnlyCompiledCss: true },
    output: { manualChunks: (id) => (id.endsWith('authored.css') ? 'authored' : undefined) },
  },
  'object-manual-chunks': {
    options: { sortOnlyCompiledCss: true },
    output: { manualChunks: { vendor: ['react'] } },
  },
};

(async () => {
  const scenario = scenarios[process.argv[2]];
  const root = fs.mkdtempSync(join(os.tmpdir(), 'compiled-vite-sort-'));

  try {
    fs.writeFileSync(
      join(root, 'entry.js'),
      "import './authored.css';\nimport './a.compiled.css';\nimport './b.compiled.css';\nconsole.log('app');\n"
    );
    // The longhand comes first in the first file, so file order alone would be wrong.
    fs.writeFileSync(join(root, 'a.compiled.css'), fontWeight);
    fs.writeFileSync(join(root, 'b.compiled.css'), font);
    fs.writeFileSync(join(root, 'authored.css'), authored);

    const result = await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [compiledVitePlugin(scenario.options)],
      build: {
        write: false,
        cssMinify: false,
        rollupOptions: { input: join(root, 'entry.js'), output: scenario.output },
      },
    });
    const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);

    console.log(
      JSON.stringify({
        css: outputs
          .filter((file) => file.type === 'asset' && file.fileName.endsWith('.css'))
          .map((file) => ({
            name: file.fileName,
            source: String(file.source).replace(/\s+/g, ''),
          })),
      })
    );
  } catch (error) {
    console.log(JSON.stringify({ error: error.message }));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
})();
