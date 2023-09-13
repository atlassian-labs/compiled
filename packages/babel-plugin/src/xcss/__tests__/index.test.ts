import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../index';

describe('xcss', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `{
        color: 'green',
        backgroundColor: 'green'
    }`;

  it('should transform xcss', () => {
    const actual = transform(`
      import { xcss } from '@compiled/react';

      const styles = xcss(${styles});
    `);

    expect(actual).toInclude('const styles="_syazbf54 _bfhkbf54";');
  });

  it('should error out if xcss is not defined at the top-most scope of the module.', () => {
    expect(() => {
      transform(`
      import { xcss } from '@compiled/react';

      const styles = {
        foo: xcss(${styles}),
      }
    `);
    }).toThrow(ErrorMessages.DEFINE_XCSS);

    expect(() => {
      transform(`
      import { xcss } from '@compiled/react';

      const styles = () => xcss(${styles})
    `);
    }).toThrow(ErrorMessages.DEFINE_XCSS);
  });

  it('should error out if xcss receives more than one argument', () => {
    expect(() => {
      transform(`
        import { xcss } from '@compiled/react';
  
        const styles = xcss(${styles}, ${styles})
      `);
    }).toThrow(ErrorMessages.NUMBER_OF_ARGUMENT);
  });

  it('should error out if xcss does not receive an object', () => {
    expect(() => {
      transform(`
        import { xcss } from '@compiled/react';
  
        const styles = xcss('color: red')
      `);
    }).toThrow(ErrorMessages.ARGUMENT_TYPE);
  });

  it('should error out if a runtime variable is used', () => {
    expect(() => {
      transform(`
        import { xcss } from '@compiled/react';

        const styles = xcss({
          color
        });
      `);
    }).toThrow(ErrorMessages.STATIC_CSS);
  });

  it('should error out if styles include conditional CSS', () => {
    expect(() => {
      transform(`
        import { xcss } from '@compiled/react';

        const styles = xcss({
          color: canNotBeStaticallyEvulated ? 'red' : 'blue'
        });
      `);
    }).toThrow(ErrorMessages.STATIC_CSS);
  });
});
