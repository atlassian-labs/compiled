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

  it('should conditionally return blue color', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    expect(cstyle([styles.red, styles.blue])).toEqual(styles.blue);
  });

  it('should throw when not transformed', () => {
    expect(() => untransformed_cstyle.create({})).toThrow();
  });

  it('should conditionally apply arrays', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    expect(cstyle([true && [styles.red, styles.blue]])).toEqual(styles.blue);
  });

  it('should conditionally apply arrays', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
      green: {
        color: 'green',
      },
      purple: {
        color: 'purple',
      },
    });

    expect(cstyle([styles.red, [styles.blue], [[styles.green]], [[[styles.purple]]]])).toEqual(
      styles.purple
    );
  });

  it('should weave in hard coded class', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
      green: {
        color: 'green',
      },
      purple: {
        color: 'purple',
      },
    });

    expect(
      cstyle([styles.red, [styles.blue], 'foo', [[styles.green]], [[[styles.purple]]]])
    ).toEqual(styles.purple + ' foo');
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
