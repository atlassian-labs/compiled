import { Style } from '@compiled/react/experimental';
import { render } from '@testing-library/react';
import React from 'react';

describe('experimental', () => {
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
});
