import { cstyle } from '@compiled/dom__experimental';

describe('dom__experimental browser', () => {
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

  it('should conditionally apply arrays', () => {
    const styles = cstyle.create({
      red: {
        color: 'red',
      },
      blue: {
        color: 'blue',
      },
    });

    const actual = cstyle([true && [styles.red, styles.blue]]);

    expect(actual).toEqual(styles.blue);
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

    const actual = cstyle([styles.red, [styles.blue], [[styles.green]], [[[styles.purple]]]]);

    expect(actual).toEqual(styles.purple);
  });

  it('should not throw away non-compiled class names', () => {
    const actual = cstyle(['ds_button_click', 'ds_button_press']);

    expect(actual).toEqual('ds_button_click ds_button_press');
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

    const actual = cstyle([
      styles.red,
      [styles.blue],
      'foo',
      [[styles.green]],
      [[[styles.purple]]],
    ]);

    expect(actual).toEqual(styles.purple + ' foo');
  });

  it('should concat styles already passed through cstyle', () => {
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
        fontWeight: 500,
        color: 'purple',
      },
    });

    const actual = cstyle([styles.red, styles.blue, cstyle([styles.green, styles.purple])]);

    expect(actual).toEqual(styles.purple.split(' ').reverse().join(' '));
  });
});
