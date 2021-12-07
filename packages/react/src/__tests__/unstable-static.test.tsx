import { Style } from '@compiled/react/unstable-static';
import { render } from '@testing-library/react';
import React from 'react';

import { Style as untransformed_Style } from '../unstable-static';

describe('unstable-static', () => {
  it('should build styles', () => {
    const styles = Style.create({
      red: {
        color: 'red',
      },
    });

    expect(styles.red).toEqual('_syaz5scu');
  });

  it('should color a div', () => {
    const styles = Style.create({
      red: {
        color: 'red',
      },
    });

    const { getByText } = render(<div className={styles.red}>foo</div>);

    expect(getByText('foo')).toHaveCompiledCss('color', 'red');
  });

  it('should conditionally return blue color', () => {
    const styles = Style.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    expect(Style([styles.red, styles.blue])).toEqual(styles.blue);
  });

  it('should throw when not transformed', () => {
    expect(() => untransformed_Style.create({})).toThrow();
  });

  it('should conditionally apply arrays', () => {
    const styles = Style.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    expect(Style([true && [styles.red, styles.blue]])).toEqual(styles.blue);
  });

  it('should conditionally apply arrays', () => {
    const styles = Style.create({
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

    expect(Style([styles.red, [styles.blue], [[styles.green]], [[[styles.purple]]]])).toEqual(
      styles.purple
    );
  });

  it('should weave in hard coded class', () => {
    const styles = Style.create({
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
      Style([styles.red, [styles.blue], 'foo', [[styles.green]], [[[styles.purple]]]])
    ).toEqual(styles.purple + ' foo');
  });

  it('should only insert once', () => {
    Style.create({
      red: {
        color: 'red',
      },
    });

    Style.create({
      red: {
        color: 'red',
      },
    });

    expect(document.head.innerHTML).toIncludeRepeated('color:red', 1);
  });
});
