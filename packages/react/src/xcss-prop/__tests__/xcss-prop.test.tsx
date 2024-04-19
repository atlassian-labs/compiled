/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap, cx } from '@compiled/react';
import { render } from '@testing-library/react';
import { expectTypeOf } from 'expect-type';

import type { XCSSProp, XCSSAllProperties, XCSSAllPseudos } from '../index';

describe('xcss prop', () => {
  it('should allow all styles from xcss prop to class name when no constraints are applied', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<XCSSAllProperties, XCSSAllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red', '&::after': { backgroundColor: 'green' } },
    });

    const { getByText } = render(<CSSPropComponent xcss={styles.redColor} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should type error when given a pseudo and none are allowed', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<XCSSAllProperties, never> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red', '&::after': { backgroundColor: 'green' } },
    });

    const { getByText } = render(
      <CSSPropComponent
        // @ts-expect-error — Types of property '"&::after"' are incompatible.
        xcss={styles.redColor}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should concat styles from class name and xcss prop', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<XCSSAllProperties, XCSSAllPseudos> }) {
      return (
        <div css={{ color: 'blue' }} className={xcss}>
          foo
        </div>
      );
    }

    const styles = cssMap({
      redColor: { color: 'red' },
    });

    const { getByText } = render(<CSSPropComponent xcss={styles.redColor} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should type error when passing styles that are not defined', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', XCSSAllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { backgroundColor: 'red' },
    });

    expectTypeOf(
      <CSSPropComponent
        // @ts-expect-error — Types of property 'backgroundColor' are incompatible.
        xcss={styles.redColor}
      />
    ).toBeObject();
  });

  it('should concat styles together', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<XCSSAllProperties, XCSSAllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }
    const styles = cssMap({
      redColor: { color: 'red' },
      greenBackground: { color: 'blue', backgroundColor: 'green' },
    });

    const { getByText } = render(
      <CSSPropComponent xcss={cx(styles.redColor, styles.greenBackground)} />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'blue');
    expect(getByText('foo')).toHaveCompiledCss('backgroundColor', 'green');
  });

  it('should conditionally apply styles directly', () => {
    const styles = cssMap({
      redColor: { color: 'red' },
      blueColor: { color: 'blue' },
    });
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', never> }) {
      return <div className={xcss}>foo</div>;
    }
    function Parent({ isRed }: { isRed: boolean }) {
      return <CSSPropComponent xcss={isRed ? styles.redColor : styles.blueColor} />;
    }

    const { getByText, rerender } = render(<Parent isRed />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'blue');

    rerender(<Parent isRed={false} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'blue');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'red');
  });

  it('should conditionally apply styles via cx function', () => {
    const styles = cssMap({
      redColor: { color: 'red' },
      blueColor: { color: 'blue' },
    });
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', never> }) {
      return <div className={xcss}>foo</div>;
    }
    function Parent({ isRed }: { isRed: boolean }) {
      return <CSSPropComponent xcss={cx(isRed && styles.redColor, !isRed && styles.blueColor)} />;
    }

    const { getByText, rerender } = render(<Parent isRed />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'blue');

    rerender(<Parent isRed={false} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'blue');
    expect(getByText('foo')).not.toHaveCompiledCss('color', 'red');
  });

  it('should transform inline object', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', XCSSAllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const { getByText } = render(<CSSPropComponent xcss={{ color: 'green' }} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'green');
  });

  it('should type error when passing in a disallowed value in a pseudo mixed with allowed values', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', '&:hover'> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red', '&:hover': { color: 'red', backgroundColor: 'red' } },
    });

    expectTypeOf(
      <CSSPropComponent
        // @ts-expect-error — Types of property 'backgroundColor' are incompatible.
        xcss={styles.redColor}
      />
    ).toBeObject();
    expectTypeOf(
      <CSSPropComponent
        xcss={{
          color: 'red',
          '&:hover': {
            color: 'red',
            // @ts-expect-error — Types of property 'backgroundColor' are incompatible.
            backgroundColor: 'red',
          },
        }}
      />
    ).toBeObject();
  });

  it('should type error when passing in @media property to xcss prop', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', '&:hover'> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red', '@media': { 'screen and': { color: 'red' } } },
    });

    expectTypeOf(
      <CSSPropComponent
        // @ts-expect-error — Types of property '"@media"' are incompatible.
        xcss={styles.redColor}
      />
    ).toBeObject();
    expectTypeOf(
      <CSSPropComponent
        xcss={{
          color: 'red',
          // @ts-expect-error — Type '{ screen: { color: string; backgroundColor: string; }; }' is not assignable to type 'undefined'.
          '@media': {
            screen: { color: 'red', backgroundColor: 'red' },
          },
        }}
      />
    ).toBeObject();
  });

  it('should block selectors api from CSS Map', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', '&:hover'> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      primary: {
        selectors: { '&:not(:first-child):last-child': { color: 'red' } },
      },
    });

    expectTypeOf(
      <CSSPropComponent
        // @ts-expect-error — Type 'CompiledStyles<{ '&:not(:first-child):last-child': { color: "red"; }; }>' is not assignable to type 'undefined'.
        xcss={styles.primary}
      />
    ).toBeObject();
  });

  it('should mark a xcss prop as required', () => {
    function CSSPropComponent({
      xcss,
    }: {
      xcss: XCSSProp<'color' | 'backgroundColor', '&:hover', { requiredProperties: 'color' }>;
    }) {
      return <div className={xcss}>foo</div>;
    }

    expectTypeOf(
      <CSSPropComponent
        // @ts-expect-error — Type '{}' is not assignable to type 'XCSSProp<"backgroundColor" | "color", "&:hover", { requiredProperties: "color"; }>'.
        xcss={{}}
      />
    ).toBeObject();
  });

  it('should mark a xcss prop inside a pseudo as required', () => {
    function CSSPropComponent({
      xcss,
    }: {
      xcss: XCSSProp<'color' | 'backgroundColor', '&:hover', { requiredProperties: 'color' }>;
    }) {
      return <div className={xcss}>foo</div>;
    }

    expectTypeOf(
      <CSSPropComponent
        xcss={{
          color: 'red',
          // @ts-expect-error — Property 'color' is missing in type '{}' but required in type '{ readonly color: string | number | CompiledPropertyDeclarationReference; }'.
          '&:hover': {},
        }}
      />
    ).toBeObject();
  });

  it('should accept an object with specific allowed values in TAllowedProperties', () => {
    function CSSPropComponent({
      xcss,
    }: {
      xcss: XCSSProp<
        {
          color: 'color.text.red' | 'color.text.blue';
        },
        never
      >;
      // As with standard XCSS, invalid XCSS attributes don't error
      xcssWrong?: XCSSProp<{ color: 'color.text.red'; invalidCSSAttr: 'invalid' }, never>;
    }) {
      return <div className={xcss}>foo</div>;
    }

    expectTypeOf(
      <>
        <CSSPropComponent
          xcss={{
            color: 'color.text.red',
          }}
        />
        <CSSPropComponent
          xcss={{
            // @ts-expect-error - Type '"red"' is not assignable to type '"color.red" | "color.blue"'.
            color: 'red',
            // @ts-expect-error - Type 'string' is not assignable to type 'undefined'.
            backgroundColor: 'color.background',
          }}
        />
      </>
    ).toBeObject();
  });

  it('should enforce required properties when TAllowedProperties set to an object', () => {
    function CSSPropComponent({
      xcss,
    }: {
      xcss: XCSSProp<
        { color: 'color.text.red' | 'color.text.blue'; borderColor?: 'color.border' },
        never
      >;
    }) {
      return <div className={xcss}>foo</div>;
    }

    expectTypeOf(
      <>
        <CSSPropComponent
          // @ts-expect-error — Property 'color' is missing in type '{}' but required in type {color: 'color.red' | 'color.blue'}.
          xcss={{}}
        />
        <CSSPropComponent
          xcss={{
            color: 'color.text.red',
            // Border color is optional
          }}
        />
      </>
    ).toBeObject();
  });

  it('should detect and enforce correct pseudos when TAllowedProperties set to an object', () => {
    function CSSPropComponent({
      xcss,
    }: {
      xcss: XCSSProp<
        {
          color: 'color.text.red' | 'color.text.blue';
          borderColor?: 'color.border';
          '&:hover': {
            color: 'color.text.green';
          };
          // All pseudos are optional; optional pseudos don't work as expected currently
          '&:active'?: object;
        },
        never
      >;
      xcssInvalid?: XCSSProp<
        {
          color: 'color.text.red' | 'color.text.blue';
        },
        // @ts-expect-error - Type 'string' is not assignable to type 'never'.
        '&:hover' | '&:active'
      >;
    }) {
      return <div className={xcss}>foo</div>;
    }

    const validStyles = cssMap({
      validPseudoMissingOptional: {
        color: 'color.text.red',

        '&:hover': {
          color: 'color.text.green',
        },
      },
      validPseudoProvidedOptional: {
        color: 'color.text.red',
        '&:hover': {
          color: 'color.text.green',
        },
        '&:active': {
          color: 'color.text.red',
        },
      },
      // We don't currently support enforcing required pseudos
      missingRequiredPseudo: {
        color: 'color.text.red',
      },
    });

    const invalidStyles = cssMap({
      validPseudoInvalidValue: {
        color: 'color.text.red',

        '&:hover': {
          color: 'color.text.red',
        },
      },
      validPseudoCompletelyInvalidValue: {
        color: 'color.text.red',

        '&:hover': {
          color: 'invalid color',
        },
      },
      invalidPseudo: {
        color: 'color.text.red',
        '&::after': {
          color: 'invalid color',
        },
      },
      missingRequiredPropInPseudo: {
        color: 'color.text.red',
        '&:hover': {},
      },
    });

    expectTypeOf(
      <>
        <CSSPropComponent xcss={validStyles.validPseudoMissingOptional} />
        <CSSPropComponent xcss={validStyles.validPseudoProvidedOptional} />
        <CSSPropComponent xcss={validStyles.missingRequiredPseudo} />

        <CSSPropComponent
          // @ts-expect-error — Type '"color.text.red"' is not assignable to type '"color.text.green"'
          xcss={invalidStyles.validPseudoInvalidValue}
        />
        <CSSPropComponent
          // @ts-expect-error - Type '"invalid color"' is not assignable to type '"color.text.green" | undefined'.
          xcss={invalidStyles.validPseudoCompletelyInvalidValue}
        />

        <CSSPropComponent
          // @ts-expect-error - Type '{ color: "invalid color"; }' is not assignable to type 'undefined'
          xcss={invalidStyles.invalidPseudo}
        />
        <CSSPropComponent
          // @ts-expect-error - Property 'color' is missing in type 'CompiledStyles<{}>' but required in type '{ readonly color: "color.text.green"; }
          xcss={invalidStyles.missingRequiredPropInPseudo}
        />
      </>
    ).toBeObject();
  });
});
