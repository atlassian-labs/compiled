import { render } from '@testing-library/react';
import { Global } from '../index';

describe('global component', () => {
  it('should throw', () => {
    expect(() => {
      render(<Global style={`font-size: 12px`} />);
    }).toThrow();
  });
});
