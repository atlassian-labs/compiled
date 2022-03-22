/**
 * @jest-environment node
 */

import { join } from 'path';

import Parcel, { createWorkerFarm } from '@parcel/core';
import { MemoryFS } from '@parcel/fs';

const rootPath = join(__dirname, '..', '..', '..', '..');
const fixtureRoot = join(rootPath, 'fixtures/parcel-optimizer-test-app');

const workerFarm = createWorkerFarm();
const outputFS = new MemoryFS(workerFarm);

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
});

afterAll(() => {
  workerFarm.end();
});

describe('optimizer', () => {
  it('sorts css rules', async () => {
    const { changedAssets, bundleGraph } = await parcel.run();
    const asset = Array.from(changedAssets.values()).find(
      (asset) => asset.filePath === join(fixtureRoot, '/src/styles.css')
    );

    const outputCss = await outputFS.readFile(
      bundleGraph.getBundlesWithAsset(asset!)[0].filePath,
      'utf8'
    );
    expect(outputCss).toMatchInlineSnapshot(`
      "

      .color-blue {
        color: blue;
      }

      .color-blue:focus {
        color: orange;
      }

      .color-blue:hover {
        color: green;
      }

      @media screen {
        .media-screen-color-red {
          color: red;
        }
      }

      @media (min-width: 500px) {
        .media-min-width-border {
          border: 2px solid red;
        }
        .media-min-width-border:before {
          content: 'large screen';
        }
      }
      "
    `);
  }, 30000);
});
