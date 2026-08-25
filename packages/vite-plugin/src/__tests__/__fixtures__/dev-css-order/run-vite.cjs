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

const { build, createServer } = require('vite');
const { join } = require('path');

const compiledVitePlugin = require('../../../index').default;

const extractDefaultExport = (code) => {
  const declaration = code.match(/export default ("(?:[^"\\]|\\.)*")/);
  if (!declaration) {
    throw new Error(`Could not find the inline CSS export in:\n${code}`);
  }
  return JSON.parse(declaration[1]);
};

const waitFor = async (condition) => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Timed out while waiting for the development stylesheet to update');
};

const exerciseRuntime = async (runtimeCode, origin, inlineCss) => {
  const styles = [];
  const nonceMeta = {
    nonce: 'test-nonce',
    getAttribute: () => 'test-nonce',
  };
  const originalDocument = global.document;
  const originalFetch = global.fetch;

  global.document = {
    head: {
      appendChild(style) {
        styles.push(style);
      },
    },
    createElement() {
      return {
        attributes: {},
        textContent: '',
        setAttribute(name, value) {
          this.attributes[name] = value;
        },
        remove() {
          const index = styles.indexOf(this);
          if (index !== -1) {
            styles.splice(index, 1);
          }
        },
      };
    },
    querySelector(selector) {
      if (selector === 'meta[property="csp-nonce"]') {
        return nonceMeta;
      }
      return styles[0];
    },
  };
  global.fetch = (url, options) => originalFetch(new URL(url, origin), options);

  try {
    const runtimeUrl = `data:text/javascript;base64,${Buffer.from(runtimeCode).toString('base64')}`;
    const runtime = await import(runtimeUrl);

    runtime.registerCompiledCss('overrides', inlineCss[0]);
    const styleCountBeforeSort = styles.length;
    const cssBeforeSort = styles[0].textContent;
    runtime.registerCompiledCss('base', inlineCss[1]);
    await waitFor(() => styles[0]?.textContent.includes('@media'));

    const combinedCss = styles[0].textContent;
    const nonce = styles[0].attributes.nonce;
    const styleCount = styles.length;

    runtime.registerCompiledCss('base', inlineCss[1].replace('display: none', 'display: block'));
    await waitFor(() => styles[0]?.textContent.includes('display: block'));
    const cssAfterHmr = styles[0].textContent;

    runtime.unregisterCompiledCss('overrides');
    await waitFor(() => styles[0] && !styles[0].textContent.includes('@media'));
    const cssAfterPrune = styles[0].textContent;

    runtime.unregisterCompiledCss('base');
    await waitFor(() => styles.length === 0);

    return {
      combinedCss,
      cssAfterHmr,
      cssAfterPrune,
      nonce,
      styleCount,
      styleCountBeforeSort,
      cssBeforeSort,
      styleCountAfterPrune: styles.length,
    };
  } finally {
    global.document = originalDocument;
    global.fetch = originalFetch;
  }
};

async function runDevServer() {
  const server = await createServer({
    appType: 'custom',
    base: '/test-base/',
    configFile: false,
    logLevel: 'silent',
    optimizeDeps: {
      noDiscovery: true,
    },
    plugins: [compiledVitePlugin()],
    root: __dirname,
    server: {
      host: '127.0.0.1',
      port: 0,
    },
  });

  try {
    await server.listen();

    const entryResult = await server.transformRequest('/entry.js');
    const entryModule = await server.moduleGraph.getModuleByUrl('/entry.js');
    const proxyModules = [...entryModule.importedModules].filter((module) =>
      module.id.includes('virtual:@compiled/vite-plugin/css-proxy:')
    );
    const proxyResults = await Promise.all(
      proxyModules.map((module) => server.transformRequest(module.url))
    );

    const inlineModules = proxyModules.map((proxy) => {
      const inlineModule = [...proxy.importedModules].find((module) =>
        module.id.endsWith('.compiled.css?inline')
      );
      if (!inlineModule) {
        throw new Error(`Could not find the inline CSS dependency for ${proxy.id}`);
      }
      return inlineModule;
    });
    const inlineResults = await Promise.all(
      inlineModules.map((module) => server.transformRequest(module.url))
    );
    const inlineCss = inlineResults.map((result) => extractDefaultExport(result.code));

    const runtimeModule = [...proxyModules[0].importedModules].find(
      (module) => module.id === '\0virtual:@compiled/vite-plugin/css-runtime'
    );
    if (!runtimeModule) {
      throw new Error('Could not find the Compiled development CSS runtime');
    }
    const runtimeResult = await server.transformRequest(runtimeModule.url);

    const address = server.httpServer.address();
    const origin = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${origin}/test-base/@compiled/vite-plugin/sort-css`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inlineCss),
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }

    const sortedCss = await response.text();
    const browserRuntime = await exerciseRuntime(runtimeResult.code, origin, inlineCss);
    const ssrResult = await server.transformRequest('/entry.js', { ssr: true });

    return {
      entry: entryResult.code,
      proxies: proxyResults.map((result) => result.code),
      inlineCss,
      runtime: runtimeResult.code,
      sortedCss,
      browserRuntime,
      hmr: proxyModules.map((proxy, index) => ({
        proxyIsSelfAccepting: proxy.isSelfAccepting,
        inlineIsSelfAccepting: inlineModules[index].isSelfAccepting,
        inlineImporters: [...inlineModules[index].importers].map((module) => module.id),
      })),
      ssr: ssrResult.code,
    };
  } finally {
    await server.close();
  }
}

async function runBuild() {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [compiledVitePlugin()],
    root: __dirname,
    build: {
      minify: false,
      rollupOptions: {
        input: join(__dirname, 'entry.js'),
      },
      write: false,
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(
    (buildResult) => buildResult.output
  );

  return {
    js: outputs
      .filter((output) => output.type === 'chunk')
      .map((output) => output.code)
      .join('\n'),
    css: outputs
      .filter((output) => output.type === 'asset' && output.fileName.endsWith('.css'))
      .map((output) => output.source)
      .join('\n'),
  };
}

async function main() {
  const dev = await runDevServer();
  const production = await runBuild();
  process.stdout.write(JSON.stringify({ dev, production }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
