/** @jsxImportSource @compiled/react */
// eslint-disable-next-line import/no-extraneous-dependencies
import { cssMap as cssMapLoose } from '@compiled/react';
import { render } from '@testing-library/react';

import { cssMap } from '../../create-strict-api/__tests__/__fixtures__/strict-api';
import type { XCSSProp } from '../../create-strict-api/__tests__/__fixtures__/strict-api';
import type { XCSSAllProperties, XCSSAllPseudos } from '../index';

function CSSPropComponent({
  xcss,
}: {
  xcss: ReturnType<typeof XCSSProp<XCSSAllProperties, XCSSAllPseudos>>;
}) {
  return <div className={xcss}>foo</div>;
}

const styles = cssMap({
  invalidMediaObject: {
    // @ts-expect-error — @media at rule object is not allowed in strict cssMap
    '@media': {
      screen: { color: 'red' },
    },
  },
  invalidQuery: {
    // @ts-expect-error — this specific @media is not in our allowed types
    '@media (min-width: 100px)': {
      color: 'red',
    },
  },
  valid: {
    '@media (min-width: 110rem)': {
      // @ts-expect-error — color should be a value from the strict schema
      color: 'red',
    },
  },
});

const looseStyles = cssMapLoose({
  invalid: {
    '@media': {
      screen: { color: 'var(--ds-text)' },
    },
  },
  valid: {
    '@media (min-width: 110rem)': {
      color: 'var(--ds-text)',
    },
  },
});

describe('xcss prop', () => {
  it('should allow valid media queries from loose api', () => {
    const { getByText } = render(<CSSPropComponent xcss={looseStyles.valid} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'var(--ds-text)', {
      media: '(min-width: 110rem)',
    });
  });

  it('should type error invalid media queries from loose api', () => {
    const { getByText } = render(
      <CSSPropComponent
        // @ts-expect-error — Types of property '"@media"' are incompatible.
        xcss={looseStyles.invalid}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'var(--ds-text)', { media: 'screen' });
  });

  it('should allow valid media queries in inline xcss prop', () => {
    const { getByText } = render(
      <CSSPropComponent
        xcss={{
          '@media (min-width: 110rem)': {
            color: 'var(--ds-text)',
          },
        }}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'var(--ds-text)', {
      media: '(min-width: 110rem)',
    });
  });

  it('should allow valid media queries in inline xcss prop', () => {
    const { getByText } = render(
      <CSSPropComponent
        xcss={{
          '@media (min-width: 110rem)': {
            // @ts-expect-error — color should be a value from the strict schema
            color: 'red',
          },
        }}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: '(min-width: 110rem)' });
  });

  it('should allow valid psuedo through inline xcss prop', () => {
    const { getByText } = render(
      <CSSPropComponent
        xcss={{ '@media (min-width: 30rem)': { '&:hover': { color: 'var(--ds-text-hover)' } } }}
      />
    );

    expect(getByText('foo')).toHaveCompiledCss('color', 'var(--ds-text-hover)', {
      media: '(min-width: 30rem)',
      target: ':hover',
    });
  });

  it('should type error for disallowed nested media query object from cssMap', () => {
    const { getByText } = render(<CSSPropComponent xcss={styles.invalidMediaObject} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: 'screen' });
  });

  it('should type check top level media query styles from cssMap', () => {
    const { getByText } = render(<CSSPropComponent xcss={styles.valid} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red', { media: '(min-width: 110rem)' });
  });
});
