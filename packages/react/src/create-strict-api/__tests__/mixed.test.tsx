/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css } from '@compiled/react';
import { css as strictCSS } from '@fixture/strict-api-test';
import { render } from '@testing-library/react';

describe('strict api used with top level api', () => {
  it('should mix styles together deterministically', () => {
    const styles = strictCSS({
      color: 'var(--ds-text)',
    });
    const otherStyles = css({
      backgroundColor: 'red',
      color: 'blue',
    });

    const { getByTestId } = render(<div css={[styles, otherStyles]} data-testid="div" />);

    expect(getByTestId('div')).not.toHaveCompiledCss('color', 'var(--ds-text)');
    expect(getByTestId('div')).toHaveCompiledCss('color', 'blue');
    expect(getByTestId('div')).toHaveCompiledCss('backgroundColor', 'red');
  });
});
