import { join } from 'path';

import Parcel, { createWorkerFarm } from '@parcel/core';
import { MemoryFS } from '@parcel/fs';
import type { Asset } from '@parcel/types';
import { format } from 'prettier';

const rootPath = join(__dirname, '..', '..', '..', '..');

const workerFarm = createWorkerFarm();

afterAll(() => {
  workerFarm.end();
});

const outputFS = new MemoryFS(workerFarm);

const getParcelInstance = (workingDir: string, sourceMap = false) => {
  return new Parcel({
    config: join(workingDir, '.parcelrc'),
    entries: [join(workingDir, 'src', 'index.html')],
    outputFS,
    targets: {
      default: {
        distDir: join(workingDir, 'dist'),
        sourceMap: sourceMap,
      },
    },
    workerFarm,
    mode: 'production',
  });
};

it('transforms assets with swc plugin (extract:false-like output with CC/CS off by default)', async () => {
  const fixtureRoot = join(rootPath, 'fixtures/parcel-transformer-swc-test-app');
  const parcel = getParcelInstance(fixtureRoot);
  const { changedAssets } = await parcel.run();

  const asset = Array.from(changedAssets.values()).find(
    (a) => a.filePath === join(fixtureRoot, 'src/index.jsx')
  ) as Asset | undefined;

  const code = await asset?.getCode();
  // For now, just assert compilation succeeded and produced JS output
  expect(code).toBeTruthy();
}, 50000);

it('extract:true stores styleRules and optimizer inlines CSS', async () => {
  const extractionFixtureRoot = join(rootPath, 'fixtures/parcel-transformer-swc-test-extract-app');
  const parcel = getParcelInstance(extractionFixtureRoot);
  const { changedAssets, bundleGraph } = await parcel.run();

  const htmlAsset = Array.from(changedAssets.values()).find(
    (asset) => asset.filePath === join(extractionFixtureRoot, '/src/index.html')
  );

  const outputHtml = await outputFS.readFile(
    bundleGraph.getBundlesWithAsset(htmlAsset!)[0].filePath,
    'utf8'
  );

  const css = /<style>(.*?)<\/style>/.exec(outputHtml)?.pop();
  if (!css) throw new Error('No CSS is found.');
  console.log(outputHtml)

  expect(
    format(css, {
      parser: 'css',
      singleQuote: true,
    })
  ).toMatch(/font-size: 50px/);
}, 50000);


