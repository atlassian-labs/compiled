/**
 * @jest-environment node
 */
import { cstyle } from '@compiled/dom__experimental';

describe('dom__experimental ssr', () => {
  it('should noop on the server', () => {
    expect(() => {
      cstyle.create({
        red: {
          color: 'red',
        },
      });
    }).not.toThrow();
  });
});
