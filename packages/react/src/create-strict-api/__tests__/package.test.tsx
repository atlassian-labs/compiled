/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { css } from '@fixture/strict-api-test';
import { render } from '@testing-library/react';

describe('createStrictAPI()', () => {
  describe('css()', () => {
    it('should type error when circumventing the excess property check', () => {
      const styles = css({
        color: 'var(--ds-text)',
        '&:hover': {
          color: 'var(--ds-text-hover)',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('color', 'var(--ds-text)');
    });
  });
});
