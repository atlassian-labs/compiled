/** @jsxImportSource @compiled/react */
import { cssMap } from '@compiled/react';
import { render } from '@testing-library/react';
import {} from 'expect-type';

import type { XCSSProp, AllCSSProperties, AllPseudos } from '../index';

describe('xcss prop', () => {
  it('should allow all styles when no constraints are applied', () => {
    function CSSPropComponent({ xcss }: { xcss: XCSSProp<AllCSSProperties, AllPseudos> }) {
      return <div className={xcss}>foo</div>;
    }

    const styles = cssMap({
      after: { color: 'red' },
    });

    const { getByText } = render(<CSSPropComponent xcss={styles.after} />);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });
});
