/** @jsxImportSource @compiled/react */
import { cstyle } from '@compiled/dom__experimental';
import { render } from '@testing-library/react';

describe('composing with other compiled APIs', () => {
  it('should take dom styles over react styles', () => {
    const styles = cstyle.create({
      blue: { color: 'blue' },
    });

    const { getByText } = render(
      <div className={styles.blue} css={{ color: 'red' }}>
        foo
      </div>
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'blue');
  });

  it('should take react styles over dom styles', () => {
    const styles = cstyle.create({
      blue: { color: 'blue' },
    });
    function Text({ className }: { className?: string }) {
      return <div className={cstyle([styles.blue, className])}>foo</div>;
    }

    const { getByText } = render(<Text css={{ color: 'red' }} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });
});
