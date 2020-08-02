jest.mock('glob', () => ({
  sync: jest.fn(),
}));

import { sync as globSync } from 'glob';

import { getTransformPath, getTransforms } from '../transforms';

describe('transforms', () => {
  describe('#getTransformPath', () => {
    it('should build transform path', () => {
      const parsedPath = {
        base: 'index.ts',
        dir: 'node_modules/@compiled/css-in-js/dist/codemods/styled-components-to-compiled',
        ext: '.ts',
        name: 'index',
        root: '',
      };

      expect(getTransformPath(parsedPath)).toEqual(
        'node_modules/@compiled/css-in-js/dist/codemods/styled-components-to-compiled/index.ts'
      );
    });
  });

  describe('#getTransforms', () => {
    it('should get available transforms in alphabetical directory sorted order', () => {
      (globSync as jest.Mock).mockImplementationOnce(() => [
        'node_modules/@compiled/css-in-js/dist/codemods/styled-components-to-compiled/index.ts',
        'node_modules/@compiled/css-in-js/dist/codemods/emotion-to-compiled/index.ts',
      ]);

      expect(getTransforms()).toEqual([
        {
          base: 'index.ts',
          dir: 'node_modules/@compiled/css-in-js/dist/codemods/emotion-to-compiled',
          ext: '.ts',
          name: 'index',
          root: '',
        },
        {
          base: 'index.ts',
          dir: 'node_modules/@compiled/css-in-js/dist/codemods/styled-components-to-compiled',
          ext: '.ts',
          name: 'index',
          root: '',
        },
      ]);
    });
  });
});
