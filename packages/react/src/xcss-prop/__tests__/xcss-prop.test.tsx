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

  it('should type error when given a pseduo and none are allowed', () => {
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
        // @ts-expect-error — Types of property 'backgroundColor' are incompatible.
        xcss={{ color: 'red', '&:hover': { color: 'red', backgroundColor: 'red' } }}
      />
    ).toBeObject();
  });

  it('should type error when passing in at rules to xcss prop', () => {
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
        // @ts-expect-error — Type '{ screen: { color: string; backgroundColor: string; }; }' is not assignable to type 'undefined'.
        xcss={{ color: 'red', '@media': { screen: { color: 'red', backgroundColor: 'red' } } }}
      />
    ).toBeObject();
  });
});
