/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

import { cssMap } from './__fixtures__/strict-api';

describe('createStrictAPI()', () => {
  describe('cssMap()', () => {
    it('should allow valid properties', () => {
      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          accentColor: 'red',
          all: 'inherit',
          '&:hover': { color: 'var(--ds-text-hover)' },
          '&:invalid': { color: 'var(--ds-text)' },
        },
      });

      const { getByTestId } = render(<div css={styles.primary} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should allow valid properties inside pseudos that are different to root', () => {
      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          '&:hover': {
            accentColor: 'red',
            background: 'var(--ds-surface-hover)',
          },
        },
      });

      const { getByTestId } = render(<div css={styles.primary} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('background', 'var(--ds-surface-hover)', {
        target: ':hover',
      });
    });

    it('should type error invalid vales', () => {
      const styles = cssMap({
        primary: {
          // @ts-expect-error — Type '{ val: string; }' is not assignable to type 'Readonly<Properties<string | number, string & {}>> & PseudosDeclarations & EnforceSchema<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>'.
          val: 'ok',
        },
      });

      const { getByTestId } = render(<div css={styles.primary} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('val', 'ok');
    });

    it('should type error invalid values in pseudos', () => {
      const styles = cssMap({
        primary: {
          // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | undefined'.ts(2322)
          background: 'red',
          '&:hover': {
            // @ts-expect-error — Type 'string' is not assignable to type 'never'.ts(2322)
            val: 'ok',
          },
        },
      });

      const { getByTestId } = render(<div css={styles.primary} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('val', 'ok', { target: ':hover' });
    });

    it('should type error with css properties not in the style scope', () => {
      // NOTE: These are split into mutliple `css()` calls to ensure the type errors are not hidden
      // as only one will error at a time when combined into one query

      const bgStyles = cssMap({
        primary: {
          fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
          // @ts-expect-error - Object literal may only specify known properties, and 'bg' does not exist in type …
          bg: 'red',
        },
      });

      const colourStyles = cssMap({
        primary: {
          fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
          // @ts-expect-error - Object literal may only specify known properties, and 'colour' does not exist in type …
          colour: 'var(--ds-text)',
        },
      });

      const hoverStyles = cssMap({
        primary: {
          fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
          '&:hover': {
            fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
            // @ts-expect-error - Object literal may only specify known properties, and 'colour' does not exist in type …
            colour: 'var(--ds-text-hover)',
          },
        },
      });

      const invalidPsuedoStyles = cssMap({
        primary: {
          fontWeight: 'bold', // just a valid property to ensure the `extends` keyword isn't working as intended
          // @ts-expect-error - bject literal may only specify known properties, and ''&:invalid-pseudo'' does not exist in type …
          '&:invalid-pseudo': {
            color: 'var(--ds-text)',
          },
        },
      });

      const { getByTestId } = render(
        <div
          css={[
            bgStyles.primary,
            colourStyles.primary,
            hoverStyles.primary,
            invalidPsuedoStyles.primary,
          ]}
          data-testid="div"
        />
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
