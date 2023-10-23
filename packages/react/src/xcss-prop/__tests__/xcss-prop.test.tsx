/** @jsxImportSource @compiled/react */
import { cssMap, cx } from '@compiled/react';
import { render } from '@testing-library/react';
import { expectTypeOf } from 'expect-type';

import type { XCSSProp, AllCSSProperties, AllPseudos } from '../index';

describe('xcss prop', () => {
  it('should allow all styles from xcss prop to class name when no constraints are applied', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<AllCSSProperties, AllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red' },
    });

    const { getByText } = render(<CSSPropComponent xcss={styles.redColor} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  // TODO: This test throws currently because css prop can't take xcss prop.
  xit('should allow all styles from xcss prop to css prop when no constraints are applied', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<AllCSSProperties, AllPseudos> }) {
      // @compiled-disable-next-line transform-css-prop
      return <div css={xcss}>foo</div>;
    }

    const styles = cssMap({
      redColor: { color: 'red' },
    });

    const { getByText } = render(<CSSPropComponent xcss={styles.redColor} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should type error when passing styles that are not defined', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', AllPseudos> }) {
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
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<AllCSSProperties, AllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }
    const styles = cssMap({
      redColor: { color: 'red' },
      greenBackground: { backgroundColor: 'green' },
    });

    const { getByText } = render(
      <CSSPropComponent xcss={cx(styles.redColor, styles.greenBackground)} />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
    expect(getByText('foo')).toHaveCompiledCss('backgroundColor', 'green');
  });

  it('should transform inline object', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<'color', AllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const { getByText } = render(
      <CSSPropComponent
        xcss={{
          // TODO: How can we support this that doesn't break the system?
          // @ts-expect-error
          color: 'green',
        }}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'green');
  });
});
