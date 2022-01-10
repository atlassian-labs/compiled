/** @jsxRuntime classic */
/** @jsx jsx */
// eslint-disable-next-line import/no-extraneous-dependencies
import { jsx } from '@compiled/react';
import { render } from '@testing-library/react';

describe('local jsx namespace', () => {
  it('should create css from object literal', () => {
    const { getByText } = render(<div css={{ fontSize: '15px' }}>hello world</div>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should allow css prop when class name is a declared prop', () => {
    function Component({ className, children }: { className?: string; children: string }) {
      return <div className={className}>{children}</div>;
    }

    const { getByText } = render(<Component css={{ fontSize: '15px' }}>hello world</Component>);

    expect(getByText('hello world')).toHaveCompiledCss('font-size', '15px');
  });

  it('should type error css prop when class name is not a declared prop', () => {
    function Component({ children }: { children: string }) {
      return <div>{children}</div>;
    }

    const { getByText } = render(
      <Component
        // CSS prop is not allowed when class name is not a declared prop
        // @ts-expect-error
        css={{ fontSize: '15px' }}>
        hello world
      </Component>
    );

    expect(getByText('hello world')).not.toHaveCompiledCss('font-size', '15px');
  });
});
