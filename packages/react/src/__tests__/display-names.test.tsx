// eslint-disable-next-line import/no-extraneous-dependencies
import { styled } from '@compiled/react';

describe('display names', () => {
  it('should have a display name for styled', () => {
    const MyComponent = styled.div`
      color: red;
    `;

    expect(MyComponent.displayName).toEqual('MyComponent');
  });

  it('should have a display name for a stateless function', () => {
    const MyComponent = () => {
      return null;
    };

    expect(MyComponent.name).toEqual('MyComponent');
  });
});
