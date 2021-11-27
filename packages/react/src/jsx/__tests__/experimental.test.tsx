/** @jsxImportSource @compiled/react */
import { css } from '@compiled/react';
import { render } from '@testing-library/react';

describe('experiment', () => {
  it('should apply a single color', () => {
    const styles = css({
      color: 'red',
    });

    const { getByText } = render(<div css={[styles]}>foo</div>);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should apply black', () => {
    const styles = css({
      color: 'red',
    });

    const moreStyles = css({
      color: 'black',
    });

    const { getByText } = render(<div css={[styles, moreStyles]}>foo</div>);

    expect(getByText('foo')).not.toHaveCompiledCss('color', 'red');
  });

  it('should apply conditional styles', () => {
    const styles = css({
      color: 'red',
    });

    const moreStyles = css({
      color: 'black',
    });

    const { getByText, rerender } = render(
      <div css={[false && styles, false && moreStyles]}>foo</div>
    );

    expect(getByText('foo')).not.toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'black');

    rerender(<div css={[true && styles, false && moreStyles]}>foo</div>);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'black');

    rerender(<div css={[false && styles, true && moreStyles]}>foo</div>);

    expect(getByText('foo')).not.toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).toHaveCompiledCss('color', 'black');
  });
});
