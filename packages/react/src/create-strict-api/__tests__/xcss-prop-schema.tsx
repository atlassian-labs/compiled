/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap as cssMapLoose } from '@compiled/react';
import { render } from '@testing-library/react';

import { XCSSPropSchema, cssMap, cx } from './__fixtures__/strict-api';

type SchemaOptional = ReturnType<
  typeof XCSSPropSchema<{
    background?: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
    color?: 'var(--ds-text)';
  }>
>;

type SchemaRequiredBackground = ReturnType<
  typeof XCSSPropSchema<{
    background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
    color?: 'var(--ds-text)';
  }>
>;

type SchemaOptionalWithPseudo = ReturnType<
  typeof XCSSPropSchema<{
    background?: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
    color?: 'var(--ds-text)';
    '&:hover'?: {
      background?: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
      color?: 'var(--ds-text-hover)';
    };
  }>
>;

type SchemaRequiredHoverBackground = ReturnType<
  typeof XCSSPropSchema<{
    background: 'var(--ds-surface)' | 'var(--ds-surface-sunken)';
    color?: 'var(--ds-text)';
    '&:hover': {
      background: 'var(--ds-surface-hover)' | 'var(--ds-surface-sunken-hover)';
      color?: 'var(--ds-text-hover)';
    };
  }>
>;

function Button<
  T extends
    | SchemaOptional
    | SchemaRequiredBackground
    | SchemaOptionalWithPseudo
    | SchemaRequiredHoverBackground = SchemaOptional
>({ xcss, testId = 'button' }: { testId?: string; xcss: T }) {
  return <button data-testid={testId} className={xcss} />;
}

describe('createStrictAPI()', () => {
  describe('XCSSPropSchema', () => {
    it('should error with values not in the strict schema', () => {
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
      const styles = cssMap({ bg: { background: 'var(--ds-surface)' } });

      const { getByTestId } = render(<Button xcss={styles.bg} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should disallow invalid values from cssMap', () => {
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
      const styles = cssMap({
        primary: {
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
      });

      const { getByTestId } = render(<Button xcss={styles.primary} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should error with values not in the strict `CompiledAPI`', () => {
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
      const styles = cssMap({ primary: { background: 'var(--ds-surface)' } });

      const { getByTestId } = render(<Button xcss={styles.primary} />);

      expect(getByTestId('button')).toHaveCompiledCss('background', 'var(--ds-surface)');
    });

    it('should type error for invalid known values', () => {
      const { getByTestId } = render(
        <Button
          xcss={{
            // @ts-expect-error — Type '"red"' is not assignable to type '"var(--ds-surface)" | "var(--ds-surface-sunken" | CompiledPropertyDeclarationReference | undefined'.ts(2322)
            background: 'red',
            '&::after': {
              background: 'var(--ds-surface)',
            },
          }}
        />
      );

      expect(getByTestId('button')).toHaveCompiledCss('background-color', 'red');
    });

    it('should type error for invalid unknown values', () => {
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
      const styles = cssMap({
        valid: {
          background: 'var(--ds-surface)',
          '&:hover': { background: 'var(--ds-surface-hover)' },
        },
        invalidNoHover: { background: 'var(--ds-surface)' },
        invalidHoverOnly: { '&:hover': { background: 'var(--ds-surface-hover)' } },
        invalidHoverOther: { '&:hover': { color: 'var(--ds-text-hover)' } },
        invalidOtherPsuedo: {
          background: 'var(--ds-surface)',
          '&:focus': { background: 'var(--ds-surface)' },
        },
      });
      const stylesInvalid = cssMap({
        primary: { '&:focus': { background: 'var(--ds-surface)' } },
      });

      const { getByTestId } = render(
        <>
          <Button<SchemaRequiredHoverBackground> testId="valid" xcss={styles.valid} />
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

    it('should throw when calling XCSSPropSchema directly', () => {
      expect(() => {
        XCSSPropSchema();
      }).toThrow();
    });
  });
});
