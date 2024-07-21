/** @jsxImportSource @compiled/react */
import { render } from '@testing-library/react';

import { cssMap, type XCSSProp, cx } from './__fixtures__/strict-api';

const styles = cssMap({
  rootNative: {
    color: 'var(--ds-text)',
    background: 'var(--ds-surface)',
  },
  rootComponent: {
    color: 'var(--ds-text-error)',
    background: 'var(--ds-surface-overlay)',
  },
  bold: {
    color: 'var(--ds-text-bold)',
  },
  sunken: {
    background: 'var(--ds-surface-sunken)',
  },
});

function ComponentPassThrough({
  xcss,
}: {
  xcss?: ReturnType<typeof XCSSProp<'background' | 'color', '&:hover'>>;
}) {
  return <NativePassThrough xcss={cx(styles.rootComponent, xcss)} />;
}

function NativePassThrough({
  xcss,
}: {
  xcss?: ReturnType<typeof XCSSProp<'background' | 'color', '&:hover'>>;
}) {
  return <button data-testid="button" className={xcss} css={styles.rootNative} />;
}

describe('pass-through props.xcss directly to DOM', () => {
  it('works with no props.xcss', () => {
    const { getByTestId } = render(<NativePassThrough />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text)',
      background: 'var(--ds-surface)',
    });
  });

  it('works with pass-through props.xcss', () => {
    const { getByTestId } = render(<NativePassThrough xcss={styles.bold} />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text-bold)',
      background: 'var(--ds-surface)', // rootNative styles
    });
  });

  it('works with pass-through multiple props.xcss via cx', () => {
    const { getByTestId } = render(<NativePassThrough xcss={cx(styles.bold, styles.sunken)} />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text-bold)',
      background: 'var(--ds-surface-sunken)',
    });
  });
});

describe('pass-through props.xcss via another component', () => {
  it('works with no props.xcss', () => {
    const { getByTestId } = render(<ComponentPassThrough />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text-error)',
      background: 'var(--ds-surface-overlay)',
    });
  });

  it('works with pass-through props.xcss', () => {
    const { getByTestId } = render(<ComponentPassThrough xcss={styles.bold} />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text-bold)',
      background: 'var(--ds-surface-overlay)', // rootComponent styles
    });
  });

  it('works with pass-through multiple props.xcss via cx', () => {
    const { getByTestId } = render(<ComponentPassThrough xcss={cx(styles.bold, styles.sunken)} />);

    expect(getByTestId('button')).toHaveCompiledCss({
      color: 'var(--ds-text-bold)',
      background: 'var(--ds-surface-sunken)',
    });
  });
});
