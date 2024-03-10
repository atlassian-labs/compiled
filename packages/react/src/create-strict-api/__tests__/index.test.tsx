/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap as cssMapLoose } from '@compiled/react';
import { render } from '@testing-library/react';

import { css, cssMap, XCSSProp, cx } from './__fixtures__/strict-api';

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

  describe('XCSSProp', () => {
    it('should error with values not in the strict `CompiledStrictSchema`', () => {
      function Button({
        xcss,
        testId,
      }: {
        testId: string;
        xcss: ReturnType<typeof XCSSProp<'background' | 'color', '&:hover'>>;
      }) {
        return <button data-testid={testId} className={xcss} />;
      }
      // NOTE: For some reason the "background" property is being expanded to "string" instead of
      // staying narrowed as "var(--ds-surface-hover)" meaning it breaks when used with the strict
      // schema loaded XCSS prop. This is a bug and unexpected.
      const stylesValidRoot = cssMapLoose({
        primary: {
          color: 'var(--ds-text)',
          '&:hover': { color: 'var(--ds-text-hover)', background: 'var(--ds-surface-hover)' },
        },
      });
      const stylesInvalidRoot = cssMapLoose({
        primary: {
          color: 'red',
          '&:hover': { color: 'var(--ds-text-hover)', background: 'var(--ds-surface-hover)' },
        },
      });
      const stylesInvalid = cssMap({
        primary: {
          // @ts-expect-error -- This is not valid in the CompiledStrictSchema
          color: 'red',
          '&:hover': { color: 'var(--ds-text-hover)', background: 'var(--ds-surface-hover)' },
        },
      });

      const stylesValid = cssMap({
        primary: {
          color: 'var(--ds-text)',
          '&:hover': { color: 'var(--ds-text-hover)', background: 'var(--ds-surface-hover)' },
        },
      });

      const { getByTestId } = render(
        <>
          <Button
            testId="button-invalid-root"
            // @ts-expect-error — This conflicts with the custom API, should be a different bg color
            xcss={stylesInvalidRoot.primary}
          />
          <Button
            testId="button-invalid-root-cx"
            // @ts-expect-error — This conflicts with the custom API, should be a different bg color
            xcss={cx(stylesInvalidRoot.primary, stylesValid.primary)}
          />
          <Button
            testId="button-invalid-strict"
            // @ts-expect-error — TODO: This should conflict, but when `cssMap` conflicts, it gets a different type (this has `ApplySchema`, not the raw object), so this doesn't error?  Weird…
            xcss={stylesInvalid.primary}
          />
          <Button
            testId="button-invalid-strict-cx"
            // @ts-expect-error — TODO: This should conflict, but when `cssMap` conflicts, it gets a different type (this has `ApplySchema`, not the raw object), so this doesn't error?  Weird…
            xcss={cx(stylesInvalid.primary, stylesValid.primary)}
          />
          <Button
            testId="button-invalid-direct"
            xcss={{
              // @ts-expect-error — This is not in the `createStrictAPI` schema—this should be a css variable.
              color: 'red',
            }}
          />
          <Button testId="button-valid" xcss={stylesValid.primary} />
          <Button testId="button-valid-cx" xcss={cx(stylesValid.primary, stylesValid.primary)} />
          <Button testId="button-valid-root" xcss={stylesValidRoot.primary} />
          <Button
            testId="button-valid-root-cx"
            xcss={cx(stylesValidRoot.primary, stylesValid.primary)}
          />
        </>
      );

      expect(getByTestId('button-invalid-root')).toHaveCompiledCss('color', 'red');
    });

    it('should allow valid values from cssMap', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }
      const styles = cssMap({ bg: { background: 'var(--ds-surface)' } });

      const { getByTestId } = render(<Button xcss={styles.bg} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should disallow invalid values from cssMap', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', never>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const styles = cssMap({ bg: { accentColor: 'red' } });
      const { getByTestId } = render(
        <Button
          // @ts-expect-error — Type 'CompiledStyles<{ accentColor: "red"; }>' is not assignable to type ...
          xcss={styles.bg}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('accent-color', 'red');
    });

    it('should allow constrained background and pseudo', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', '&:hover'>> }) {
        return <button data-testid="button" className={xcss} />;
      }
      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
      });

      const { getByTestId } = render(<Button xcss={styles.primary} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should type error on a partially invalid declaration', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', '&:hover'>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const styles = cssMap({
        bad: {
          // @ts-expect-error — Property 'bad' is incompatible with index signature.
          foo: 'bar',
          color: 'var(--ds-text)',
        },
      });

      const { getByTestId } = render(
        <Button
          // @ts-expect-error — Type 'CompiledStyles<{ foo: string; color: "var(--ds-text)"; }>' is not assignable to type
          xcss={styles.bad}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('color', 'var(--ds-text)');
    });

    it('should error with values not in the strict `CompiledAPI`', () => {
      function Button({
        xcss,
        testId,
      }: {
        testId: string;
        xcss: ReturnType<typeof XCSSProp<'background' | 'color', '&:hover'>>;
      }) {
        return <button data-testid={testId} className={xcss} />;
      }

      const stylesOne = cssMapLoose({
        primary: {
          color: 'red',
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
      });
      const stylesTwo = cssMap({
        primary: {
          // @ts-expect-error — This is not in the `createStrictAPI` schema—this should be a css variable.
          color: 'red',
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
      });

      const { getByTestId } = render(
        <>
          <Button
            testId="button-1"
            // @ts-expect-error — This is not in the `createStrictAPI` schema—this should be a css variable.
            xcss={stylesOne.primary}
          />
          <Button
            testId="button-3"
            // @ts-expect-error — This is not in the `createStrictAPI` schema—this should be a css variable.
            xcss={stylesTwo.stylesTwo}
          />
          <Button
            testId="button-2"
            xcss={{
              // @ts-expect-error — This is not in the `createStrictAPI` schema—this should be a css variable.
              color: 'red',
            }}
          />
        </>
      );

      expect(getByTestId('button-1')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should error with properties not in the `XCSSProp`', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'color', '&:focus'>> }) {
        return <button data-testid="button" className={xcss} />;
      }

      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
      });

      const { getByTestId } = render(
        <Button
          // @ts-expect-error — Errors because `background` + `&:hover` are not in the `XCSSProp` schema.
          xcss={styles.primary}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should error with invalid values', () => {
      function Button({ xcss }: { xcss: ReturnType<typeof XCSSProp<'background', '&:hover'>> }) {
        return <button data-testid="button" className={xcss} />;
      }
      const stylesOne = cssMap({
        primary: {
          // @ts-expect-error — Fails because `foo` is not assignable to our CSSProperties whatsoever.
          foo: 'bar',
          background: 'var(--ds-surface)',
        },
      });
      const stylesTwo = cssMap({
        hover: {
          '&:hover': {
            // @ts-expect-error — Fails because `foo` is not assignable to our CSSProperties whatsoever.
            foo: 'bar',
            background: 'var(--ds-surface-hover)',
          },
        },
      });

      const { getByTestId } = render(<Button xcss={cx(stylesOne.primary, stylesTwo.hover)} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

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
        testId,
        xcss,
      }: {
        testId: string;
        xcss: ReturnType<
          typeof XCSSProp<'background' | 'color', never, { requiredProperties: 'background' }>
        >;
      }) {
        return <button data-testid={`button-${testId}`} className={xcss} />;
      }

      const stylesValid = cssMap({
        primary: { background: 'var(--ds-surface)' },
      });
      const stylesInvalid = cssMap({
        primary: { color: 'var(--ds-text)' },
      });

      const { getByTestId } = render(
        <>
          <Button testId="valid" xcss={stylesValid.primary} />
          <Button
            testId="invalid"
            // @ts-expect-error — This is not assignable as it's missing the required `background` property.
            xcss={stylesInvalid.primary}
          />
        </>
      );

      expect(getByTestId('button-valid')).toHaveCompiledCss('background', 'var(--ds-surface)');
      expect(getByTestId('button-invalid')).toHaveCompiledCss('color', 'var(--ds-text)');
    });

    it('should enforce required psuedos', () => {
      function Button({
        testId,
        xcss,
      }: {
        testId: string;
        xcss: ReturnType<
          typeof XCSSProp<'color', '&:hover' | '&:focus', { requiredProperties: never }>
        >;
      }) {
        return <button data-testid={`button-${testId}`} className={xcss} />;
      }

      const stylesValid = cssMap({
        primary: { '&:hover': { color: 'var(--ds-text-hover)' } },
      });
      const stylesInvalid = cssMap({
        primary: { '&:focus': { background: 'var(--ds-surface)' } },
      });

      const { getByTestId } = render(
        <>
          <Button testId="valid" xcss={stylesValid.primary} />
          <Button
            testId="invalid"
            // @ts-expect-error — This is not assignable as it's missing the required `background` property.
            xcss={stylesInvalid.primary}
          />
        </>
      );

      expect(getByTestId('button-valid')).toHaveCompiledCss('color', 'var(--ds-text-hover)', {
        target: ':hover',
      });
      expect(getByTestId('button-invalid')).toHaveCompiledCss('background', 'var(--ds-surface)', {
        target: ':focus',
      });
    });
  });

  it('should throw when calling XCSSProp directly', () => {
    expect(() => {
      XCSSProp();
    }).toThrow();
  });
});
