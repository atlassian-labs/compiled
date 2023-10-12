import { join } from 'path';

import { transform as transformCode } from '../test-utils';
import type { PluginOptions } from '../types';

describe('resolver', () => {
  describe('resolves imports', () => {
    const fixturesRoot = join(__dirname, '..', '__fixtures__');
    const transform = (resolver: PluginOptions['resolver']) => {
      return transformCode(
        `
        import { css } from '@compiled/react';
        import { primary } from 'test';

        <div css={css({ color: primary })} />
      `,
        {
          filename: join(__dirname, 'test.js'),
          resolver,
        }
      );
    };

    it('using an object', () => {
      const actual = transform({
        resolveSync(_, request) {
          if (request === 'test') {
            return join(fixturesRoot, 'mixins', 'simple.js');
          }

          throw new Error('Unreachable code');
        },
      });

      expect(actual).toInclude('color:red');
    });

    it('using a file path', () => {
      const actual = transform(join(fixturesRoot, 'resolver.js'));

      expect(actual).toInclude('color:red');
    });

    it('using a package name', () => {
      expect(transform('@compiled-private/resolver')).toInclude('color:red');
    });
  });
});
