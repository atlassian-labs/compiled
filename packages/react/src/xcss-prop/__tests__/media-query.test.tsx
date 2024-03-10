/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap } from '@compiled/react';
import { render } from '@testing-library/react';

import type { XCSSProp, XCSSAllProperties, XCSSAllPseudos } from '../index';

function CSSPropComponent({ xcss }: { xcss: XCSSProp<XCSSAllProperties, XCSSAllPseudos> }) {
  return <div className={xcss}>foo</div>;
}

const styles = cssMap({
  invalid: {
    '@media': { screen: { color: 'red' } },
  },
  valid: { '@media screen': { color: 'red' } },
});

describe('xcss prop', () => {
  it('should allow valid media queries in inline xcss prop', () => {
    const { getByText } = render(<CSSPropComponent xcss={{ '@media screen': { color: 'red' } }} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: 'screen' });
  });

  it('should allow valid psuedo through inline xcss prop', () => {
    const { getByText } = render(
      <CSSPropComponent xcss={{ '@media screen': { '&:hover': { color: 'green' } } }} />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'green', {
      media: 'screen',
      target: ':hover',
    });
  });

  it('should type error for disallowed nested media query object from cssMap', () => {
    const { getByText } = render(
      <CSSPropComponent
        // @ts-expect-error — @media object is not allowed in xcss prop
        xcss={styles.invalid}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: 'screen' });
  });

  it('should type check top level media query styles from cssMap', () => {
    const { getByText } = render(<CSSPropComponent xcss={styles.valid} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: 'screen' });
  });
});
