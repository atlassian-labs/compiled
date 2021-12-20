import { cstyle } from '@compiled/dom__experimental';
import { render } from '@testing-library/react';
import React from 'react';

import { cstyle as untransformed_cstyle } from '../index';

describe('dom__experimental browser', () => {
  it('should build styles', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
    });

    expect(styles.red).toEqual('_syaz5scu');
  });

  it('should color a div', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
    });

    const { getByText } = render(<div className={styles.red}>foo</div>);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should throw when not transformed', () => {
    expect(() => untransformed_cstyle.create({})).toThrow();
  });

  it('should only insert once', () => {
    cstyle.create({
      red: {
        color: 'red',
      },
    });

    cstyle.create({
      red: {
        color: 'red',
      },
    });

    expect(document.head.innerHTML).toIncludeRepeated('color:red', 1);
  });
});
