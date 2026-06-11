/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

import { css } from './__fixtures__/strict-api';

describe('createStrictAPI()', () => {
  describe('css()', () => {
    it('should type error when circumventing the excess property check', () => {
      const stylesOne = css({
        color: 'var(--ds-text)',
        accentColor: 'red',
        // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
        bkgrnd: 'red',
        '&:hover': {
          color: 'var(--ds-text-hover)',
        },
      });
      const stylesTwo = css({
        color: 'var(--ds-text)',
        accentColor: 'red',
        '&:hover': {
          color: 'var(--ds-text-hover)',
          // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
          bkgrnd: 'red',
        },
      });

      const { getByTestId } = render(<div css={[stylesOne, stylesTwo]} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('color', 'var(--ds-text)');
    });

    it('should constrain declared types for css() func', () => {
      // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
      const styles = css({ background: 'red' });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('background-color', 'red');
    });

    it('should mark all properties as optional', () => {
      const styles1 = css({});
      const styles2 = css({ '&:hover': {} });

      const { getByTestId } = render(<div css={[styles1, styles2]} data-testid="div" />);

      expect(getByTestId('div')).not.toHaveCompiledCss('color', 'red');
    });

    it('should constrain pseudos', () => {
      const styles = css({
        // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
        background: 'red',
        '&:hover': {
          // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
          background: 'red',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('background-color', 'red', { target: ':hover' });
    });

    it('should allow valid properties inside pseudos that are different to root', () => {
      const styles = css({
        background: 'var(--ds-surface)',
        '&:hover': {
          accentColor: 'red',
          background: 'var(--ds-surface-hover)',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('background', 'var(--ds-surface-hover)', {
        target: ':hover',
      });
    });

    it('should allow valid properties', () => {
      const styles = css({
        background: 'var(--ds-surface)',
        accentColor: 'red',
        color: 'var(--ds-text)',
        all: 'inherit',
        '&:hover': { color: 'var(--ds-text-hover)' },
        '&:invalid': { color: 'var(--ds-text)' },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('all', 'inherit');
    });

    it('should type error with css properties not in the style scope', () => {
      // NOTE: These are split into mutliple `css()` calls to ensure the type errors are not hidden
      // as only one will error at a time when combined into one query

      const bgStyles = css({
        fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
        // @ts-expect-error - Object literal may only specify known properties, and 'bg' does not exist in type …
        bg: 'red',
      });

      const colourStyles = css({
        fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
        // @ts-expect-error - Object literal may only specify known properties, and 'colour' does not exist in type …
        colour: 'var(--ds-text)',
      });

      const hoverStyles = css({
        fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
        '&:hover': {
          fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
          // @ts-expect-error - Object literal may only specify known properties, and 'colour' does not exist in type …
          colour: 'var(--ds-text-hover)',
        },
      });

      const invalidPsuedoStyles = css({
        fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
        // @ts-expect-error - bject literal may only specify known properties, and ''&:invalid-pseudo'' does not exist in type …
        '&:invalid-pseudo': {
          color: 'var(--ds-text)',
        },
      });

      const { getByTestId } = render(
        <div css={[bgStyles, colourStyles, hoverStyles, invalidPsuedoStyles]} data-testid="div" />
      );

      expect(getByTestId('div')).toHaveCompiledCss('font-weight', 'bold');
      expect(getByTestId('div')).toHaveCompiledCss('font-weight', 'bold', {
        target: ':hover',
      });

      // These still get compiled to css, even if they're not valid
      expect(getByTestId('div')).toHaveCompiledCss('bg', 'red');
      expect(getByTestId('div')).toHaveCompiledCss('colour', 'var(--ds-text)');
      expect(getByTestId('div')).toHaveCompiledCss('colour', 'var(--ds-text-hover)', {
        target: ':hover',
      });
    });
  });
});
