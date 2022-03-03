import { join } from 'path';

import Parcel, { createWorkerFarm } from '@parcel/core';
import { MemoryFS } from '@parcel/fs';

const rootPath = join(__dirname, '..', '..', '..', '..');
const fixtureRoot = join(rootPath, 'fixtures/parcel-resolver-test-app');

const workerFarm = createWorkerFarm();

afterAll(() => {
  workerFarm.end();
});

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

describe('resolver', () => {
  it('resolves inline !compiled-css imports', async () => {
    const { changedAssets } = await parcel.run();

    const asset = Array.from(changedAssets.values()).find((asset) => asset.type === 'css');
    const code = await asset?.getCode();
    expect(code).toMatchInlineSnapshot(`"._syaz5scu{color:red}"`);
  }, 30000);
});
