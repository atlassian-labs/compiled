import { sync as globSync } from 'glob';

import { castToJestMock } from '../../../../__tests__/test-utils';
import { getTransformPath, getTransforms } from '../transforms';

jest.mock('glob', () => ({
  sync: jest.fn(),
}));

describe('transforms', () => {
  describe('getTransformPath', () => {
    it('should build transform path', () => {
      const parsedPath = {
        base: 'index.ts',
        dir: 'node_modules/@compiled/codemods/dist/transforms/styled-components-to-compiled',
        ext: '.ts',
        name: 'index',
        root: '',
      };

      expect(getTransformPath(parsedPath)).toEqual(
        'node_modules/@compiled/codemods/dist/transforms/styled-components-to-compiled/index.ts'
      );
    });
  });

  describe('getTransforms', () => {
    it('should get available transforms in alphabetical directory sorted order', () => {
      castToJestMock(globSync).mockImplementationOnce(
        () =>
          [
            'node_modules/@compiled/codemods/dist/transforms/styled-components-to-compiled/index.ts',
            'node_modules/@compiled/codemods/dist/transforms/emotion-to-compiled/index.ts',
          ] as any
      );

      expect(getTransforms()).toEqual([
        {
          base: 'index.ts',
          dir: 'node_modules/@compiled/codemods/dist/transforms/emotion-to-compiled',
          ext: '.ts',
          name: 'index',
          root: '',
        },
        {
          base: 'index.ts',
          dir: 'node_modules/@compiled/codemods/dist/transforms/styled-components-to-compiled',
          ext: '.ts',
          name: 'index',
          root: '',
        },
      ]);
    });
  });
});
