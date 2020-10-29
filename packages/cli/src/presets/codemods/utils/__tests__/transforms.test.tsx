jest.mock('glob', () => ({
  sync: jest.fn(),
}));

import { sync as globSync } from 'glob';

import { getTransformPath, getTransforms } from '../transforms';

describe('transforms', () => {
  describe('#getTransformPath', () => {
    it('should build transform path', () => {
      const parsedPath = {
        base: 'index.tsx',
        dir: 'node_modules/@compiled/core/dist/codemods/styled-components-to-compiled',
        ext: '.tsx',
        name: 'index',
        root: '',
      };

      expect(getTransformPath(parsedPath)).toEqual(
        'node_modules/@compiled/core/dist/codemods/styled-components-to-compiled/index.tsx'
      );
    });
  });

  describe('#getTransforms', () => {
    it('should get available transforms in alphabetical directory sorted order', () => {
      (globSync as jest.Mock).mockImplementationOnce(() => [
        'node_modules/@compiled/core/dist/codemods/styled-components-to-compiled/index.tsx',
        'node_modules/@compiled/core/dist/codemods/emotion-to-compiled/index.tsx',
      ]);

      expect(getTransforms()).toEqual([
        {
          base: 'index.tsx',
          dir: 'node_modules/@compiled/core/dist/codemods/emotion-to-compiled',
          ext: '.tsx',
          name: 'index',
          root: '',
        },
        {
          base: 'index.tsx',
          dir: 'node_modules/@compiled/core/dist/codemods/styled-components-to-compiled',
          ext: '.tsx',
          name: 'index',
          root: '',
        },
      ]);
    });
  });
});
