import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

describe('css map', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `{
      danger: {
          color: 'red',
          backgroundColor: 'red'
      },
      success: {
        color: 'green',
        backgroundColor: 'green'
      }
    }`;

  it('should transform css map', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap(${styles});
    `);

    expect(actual).toInclude(
      'const styles={danger:"_syaz5scu _bfhk5scu",success:"_syazbf54 _bfhkbf54"};'
    );
  });

  it('should error out if variants are not defined at the top-most scope of the module.', () => {
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = {
        map1: cssMap(${styles}),
      }
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);

    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = () => cssMap(${styles})
    `);
    }).toThrow(ErrorMessages.DEFINE_MAP);
  });

  it('should error out if cssMap receives more than one argument', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';
  
        const styles = cssMap(${styles}, ${styles})
      `);
    }).toThrow(ErrorMessages.NUMBER_OF_ARGUMENT);
  });

  it('should error out if cssMap does not receive an object', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';
  
        const styles = cssMap('color: red')
      `);
    }).toThrow(ErrorMessages.ARGUMENT_TYPE);
  });

  it('should error out if spread element is used', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          ...base
        });
      `);
    }).toThrow(ErrorMessages.NO_SPREAD_ELEMENT);
  });

  it('should error out if object method is used', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger() {}
        });
      `);
    }).toThrow(ErrorMessages.NO_OBJECT_METHOD);
  });

  it('should error out if variant object is dynamic', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: otherStyles
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });

  it('should error out if styles include runtime variables', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: canNotBeStaticallyEvulated
          }
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });

  it('should error out if styles include conditional CSS', () => {
    expect(() => {
      transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: canNotBeStaticallyEvulated ? 'red' : 'blue'
          }
        });
      `);
    }).toThrow(ErrorMessages.STATIC_VARIANT_OBJECT);
  });
});
