import ax from '../ax';

describe('ax', () => {
  const isEnabled: boolean = (() => false)();

  it.each([
    ['should handle empty array', [], undefined],
    ['should handle array with undefined', [undefined], undefined],
    ['should handle array with falsy values', [undefined, null, false as const, ''], undefined],
    ['should join single classes together', ['foo', 'bar'], 'foo bar'],
    ['should join multi classes together', ['foo baz', 'bar'], 'foo baz bar'],
    ['should remove undefined', ['foo', 'bar', undefined], 'foo bar'],
    [
      'should ensure the last atomic declaration of a single group wins',
      ['_aaaabbbb', '_aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of many single groups wins',
      ['_aaaabbbb', '_aaaacccc', '_aaaadddd', '_aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of a multi group wins',
      ['_aaaabbbb _aaaacccc'],
      '_aaaacccc',
    ],
    [
      'should ensure the last atomic declaration of many multi groups wins',
      ['_aaaabbbb _aaaacccc _aaaadddd _aaaaeeee'],
      '_aaaaeeee',
    ],
    [
      'should ensure the last atomic declaration of many multi groups with short class name wins',
      ['_aaaabbbb', '_aaaaaaa', '_ddddbbb', '_ddddcccc'],
      '_aaaaaaa _ddddcccc',
    ],
    [
      'should not remove any atomic declarations if there are no duplicate groups',
      ['_aaaabbbb', '_bbbbcccc'],
      '_aaaabbbb _bbbbcccc',
    ],
    ['should not apply conditional class', [isEnabled && 'foo', 'bar'], 'bar'],
    [
      'should ignore non atomic declarations',
      ['hello_there', 'hello_world'],
      'hello_there hello_world',
    ],
    [
      'should ignore non atomic declarations when atomic declarations exist',
      ['hello_there', 'hello_world', '_aaaabbbb'],
      'hello_there hello_world _aaaabbbb',
    ],
    ['should remove duplicate custom class names', ['a', 'a'], 'a'],
  ])('%s', (_, params, expected) => {
    expect(ax(params)).toEqual(expected);
  });

  describe('dev warning for non-string inputs', () => {
    type AxFn = (input: unknown[]) => string | undefined;

    const originalNodeEnv = process.env.NODE_ENV;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
      consoleErrorSpy.mockRestore();
    });

    // ax() itself still throws once execution reaches the existing
    // string-only code path. That is intentional — the dev warning fires
    // first to give the developer actionable context, and the original
    // runtime behavior is unchanged in production (where the warning is
    // tree-shaken out entirely).
    const callAxIgnoringThrow = (axImpl: AxFn, input: unknown[]) => {
      try {
        axImpl(input);
      } catch {
        // expected for invalid inputs
      }
    };

    // Each test runs ax in its own module scope so the dev-warning dedup
    // state (`hasWarned`) does not leak between tests.
    const withFreshAx = (body: (axImpl: AxFn) => void) => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const axImpl = require('../ax').default as AxFn;
        body(axImpl);
      });
    };

    it('warns when an object is passed where a className string is expected', () => {
      withFreshAx((axImpl) => {
        callAxIgnoringThrow(axImpl, [{ color: 'red' }]);
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const message = consoleErrorSpy.mock.calls[0][0] as string;
      expect(message).toContain('ax() received an object');
      expect(message).toContain('css({...})');
    });

    it('does not warn for valid inputs (string, undefined, null, false, empty string)', () => {
      withFreshAx((axImpl) => {
        axImpl(['_aaaabbbb', '_aaaacccc', undefined, null, false, '']);
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('dedupes the warning so it does not spam on every render', () => {
      withFreshAx((axImpl) => {
        callAxIgnoringThrow(axImpl, [{ color: 'red' }]);
        callAxIgnoringThrow(axImpl, [{ color: 'blue' }]);
        callAxIgnoringThrow(axImpl, [{ color: 'green' }]);
      });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('does not warn in production builds', () => {
      process.env.NODE_ENV = 'production';
      withFreshAx((axImpl) => {
        callAxIgnoringThrow(axImpl, [{ color: 'red' }]);
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
