/**
 * @jest-environment node
 */
import { Style } from '@compiled/react/unstable-static';

describe('unstable-static-ssr', () => {
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
