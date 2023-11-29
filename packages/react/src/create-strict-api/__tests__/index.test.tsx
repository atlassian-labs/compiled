/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

import { css, cssMap, XCSSProp } from './__fixtures__/strict-api';

describe('createStrictAPI()', () => {
  describe('css()', () => {
    it('should type error when circumventing the excess property check', () => {
      const styles = css({
        color: 'red',
        // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
        bkgrnd: 'red',
        '&:hover': {
          color: 'var(--ds-text)',
          // @ts-expect-error — Type 'string' is not assignable to type 'undefined'.ts(2322)
          bkgrnd: 'red',
        },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('color', 'red');
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
        all: 'inherit',
        '&:hover': { color: 'var(--ds-text)' },
        '&:invalid': { color: 'orange' },
      });

      const { getByTestId } = render(<div css={styles} data-testid="div" />);

      expect(getByTestId('div')).toHaveCompiledCss('all', 'inherit');
    });
  });

  describe('cssMap()', () => {
    it('should allow valid properties', () => {
      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          accentColor: 'red',
          all: 'inherit',
          '&:hover': { color: 'var(--ds-text)' },
          '&:invalid': { color: 'orange' },
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
  });

  describe('XCSSProp', () => {
    it('should allow valid values', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(<Button xcss={{ background: 'var(--ds-surface)' }} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should type error for invalid known values', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          xcss={{
            // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | CompiledPropertyDeclarationReference | undefined'.ts(2322)
            background: 'red',
            // @ts-expect-error — Type '{ background: string; }' is not assignable to type 'undefined'.ts(2322)
            '&::after': {
              background: 'red',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('background-color', 'red');
    });

    it('should type error for invalid unknown values', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          xcss={{
            // @ts-expect-error — Type '{ asd: number; }' is not assignable to type 'Internal$XCSSProp<"background", never, { background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }, PickObjects<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>, never>'.
            asd: 0,
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('asd', '0');
    });

    it('should type error for unsupported known pseudos', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }
      const { getByTestId } = render(
        <Button
          xcss={{
            // @ts-expect-error — Object literal may only specify known properties, and '':hover'' does not exist in type
            ':hover': {
              color: 'red',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('color', 'red', { target: ':hover' });
    });

    it('should type error for unsupported unknown pseudos', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          xcss={{
            // @ts-expect-error — Object literal may only specify known properties, and '':hover'' does not exist in type
            ':asd': {
              color: 'red',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('color', 'red', { target: ':asd' });
    });

    it('should type error for invalid known values in pseudos', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'color', '&:hover'>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          xcss={{
            '&:hover': {
              // @ts-expect-error — Type '"red"' is not assignable to type 'CompiledPropertyDeclarationReference | "var(--ds-text)" | undefined'.ts(2322)
              color: 'red',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('color', 'red', { target: ':hover' });
    });

    it('should type error for invalid unknown values in pseudos', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'color', '&:hover'>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          xcss={{
            '&:hover': {
              // @ts-expect-error — Type '{ asd: string; }' is not assignable to type 'MarkAsRequired<XCSSItem<"color", { color: "var(--ds-text)"; }>, never>'.
              asd: 'red',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('asd', 'red', { target: ':hover' });
    });

    it('should enforce required properties', () => {
      function Button({
        xcss,
      }: {
        xcss: ReturnType<
          typeof XCSSProp<
            'background',
            never,
            { requiredProperties: 'background'; requiredPseudos: never }
          >
        >;
      }) {
        return <button data-testid="button" className={xcss} />;
      }

      const { getByTestId } = render(
        <Button
          // @ts-expect-error — Type '{}' is not assignable to type 'Internal$XCSSProp<"background", never, EnforceSchema<{ background: "var(--ds-surface)" | "var(--ds-surface-sunken"; }>, object, { requiredProperties: "background"; requiredPseudos: never; }>'.ts(2322)
          xcss={{}}
        />
      );

      expect(getByTestId('button')).not.toHaveCompiledCss('color', 'red');
    });
  });

  it('should throw when calling XCSSProp directly', () => {
    expect(() => {
      XCSSProp();
    }).toThrow();
  });
});
