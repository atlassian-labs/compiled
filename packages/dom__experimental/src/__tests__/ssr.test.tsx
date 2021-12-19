/**
 * @jest-environment node
 */
import { Style } from '@compiled/dom__experimental';

describe('dom__experimental ssr', () => {
  it('should noop on the server', () => {
    expect(() => {
      Style.create({
        red: {
          color: 'red',
        },
      });
    }).not.toThrow();
  });
});
