/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css, cssMap } from '@compiled/react';
import { render } from '@testing-library/react';

describe('css map', () => {
  const styles = cssMap({
    danger: {
      color: 'red',
    },
    success: {
      color: 'green',
    },
  });

  it('should generate css based on the selected variant', () => {
    const Foo = ({ variant }: { variant: keyof typeof styles }) => (
      <div css={styles[variant]}>hello world</div>
    );
    const { getByText, rerender } = render(<Foo variant="danger" />);

    expect(getByText('hello world')).toHaveCompiledCss('color', 'red');

    rerender(<Foo variant="success" />);
    expect(getByText('hello world')).toHaveCompiledCss('color', 'green');
  });

  it('should statically access a variant', () => {
    const Foo = () => <div css={styles.danger}>hello world</div>;
    const { getByText } = render(<Foo />);

    expect(getByText('hello world')).toHaveCompiledCss('color', 'red');
  });

  it('should merge styles', () => {
    const hover = css({ ':hover': { color: 'red' } });
    const Foo = () => <div css={[hover, styles.success]}>hello world</div>;
    const { getByText } = render(<Foo />);

    expect(getByText('hello world')).toHaveCompiledCss('color', 'green');
    expect(getByText('hello world')).toHaveCompiledCss('color', 'red', { target: ':hover' });
  });

  it('should conditionally apply variant', () => {
    const Foo = ({ isDanger }: { isDanger: boolean }) => (
      <div css={isDanger && styles.danger}>hello world</div>
    );
    const { getByText } = render(<Foo isDanger={true} />);

    expect(getByText('hello world')).toHaveCompiledCss('color', 'red');
  });

  it('should support popover-open pseudo-class', () => {
    const popoverStyles = cssMap({
      fade: {
        opacity: 0,
        transition:
          'opacity 175ms cubic-bezier(0.15, 1, 0.3, 1), overlay 175ms allow-discrete, display 175ms allow-discrete',
        '&:popover-open': {
          opacity: 1,
          transitionDuration: '350ms',
        },
      },
    });

    const Foo = () => <div css={popoverStyles.fade}>popover content</div>;
    const { getByText } = render(<Foo />);

    expect(getByText('popover content')).toHaveCompiledCss('opacity', '0');
    expect(getByText('popover content')).toHaveCompiledCss('opacity', '1', {
      target: ':popover-open',
    });
    expect(getByText('popover content')).toHaveCompiledCss('transition-duration', '350ms', {
      target: ':popover-open',
    });
  });
});
