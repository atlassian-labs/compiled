/**
 * @jest-environment node
 */

import { join } from 'path';

import Parcel, { createWorkerFarm } from '@parcel/core';
import { MemoryFS } from '@parcel/fs';
import { format } from 'prettier';

const rootPath = join(__dirname, '..', '..', '..', '..');
const inlineCssFixtureRoot = join(rootPath, 'fixtures/parcel-optimizer-test-app');
const externalCssFixtureRoot = join(rootPath, 'fixtures/parcel-optimizer-external-css-test-app');

const workerFarm = createWorkerFarm();
const outputFS = new MemoryFS(workerFarm);

const runParcel = async (fixtureRoot: string) => {
  const parcel = new Parcel({
    config: join(fixtureRoot, '.parcelrc'),
    entries: [join(fixtureRoot, 'src', 'index.html')],
    outputFS,
    targets: {
      default: {
        distDir: join(fixtureRoot, 'dist'),
      },
    },
    workerFarm,
    mode: 'production',
  });

  const { changedAssets, bundleGraph } = await parcel.run();

  const asset = Array.from(changedAssets.values()).find(
    (asset) => asset.filePath === join(fixtureRoot, '/src/index.html')
  );

  return outputFS.readFile(bundleGraph.getBundlesWithAsset(asset!)[0].filePath, 'utf8');
};

const expectSortedCss = (css: string) => {
  expect(
    format(css, {
      parser: 'css',
      singleQuote: true,
    })
  ).toMatchInlineSnapshot(`
    ".cc-97o8ng .editor .panel {
      background-color: gray;
      padding-top: 8px;
      padding-right: 8px;
      padding-bottom: 8px;
      padding-left: 8px;
    }
    .cc-9z735k .editor .panel {
      background-color: pink;
    }
    ._syaz5scu {
      color: red;
    }
    ._f8pjruxl:focus {
      color: orange;
    }
    ._30l3bf54:hover {
      color: green;
    }
    @media screen {
      ._43475scu {
        color: red;
      }
    }
    @media (min-width: 500px) {
      ._171dak0l {
        border: 2px solid red;
      }
      ._14yn1439 {
        content: 'large screen';
      }
    }
    "
  `);
};

afterAll(() => {
  workerFarm.end();
});

describe('optimizer', () => {
  it('sorts inline css rules', async () => {
    const outputHtml = await runParcel(inlineCssFixtureRoot);

    const css = /<style>(.*?)<\/style>/.exec(outputHtml)?.pop();

    if (!css) throw new Error('No CSS is found.');

    expectSortedCss(css);
  }, 30000);

  it('emits extracted css with a compiled-prefixed filename', async () => {
    const outputHtml = await runParcel(externalCssFixtureRoot);

    const cssFileName = /<link[^>]+href="\/?(compiled\.[^"]+\.css)"[^>]*>/.exec(outputHtml)?.pop();

    if (!cssFileName) throw new Error('No compiled CSS link is found.');

    expect(cssFileName).toMatch(/^compiled\.[a-z0-9]+\.css$/);

    const css = await outputFS.readFile(join(externalCssFixtureRoot, 'dist', cssFileName), 'utf8');

    expect(css).toContain('background-color:gray');
    expect(css).toContain('color:red');
  }, 30000);
});
