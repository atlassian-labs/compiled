import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

describe('css map basic functionality', () => {
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

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>
    `);

    expect(actual).toIncludeMultiple([
      'const styles={danger:"_syaz5scu _bfhk5scu",success:"_syazbf54 _bfhkbf54"};',
      '<span className={ax([styles.danger])}/>',
      '<span className={ax([styles.success])}/>',
    ]);
  });

  it('should transform css map when the styles are defined below the component and the component uses xcss prop', () => {
    const actual = transform(
      `
      import { cssMap } from '@compiled/react';

      <Box xcss={styles.danger} />

      const styles = cssMap(${styles});
    `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _4 = "._bfhkbf54{background-color:green}";
      const _3 = "._syazbf54{color:green}";
      const _2 = "._bfhk5scu{background-color:red}";
      const _ = "._syaz5scu{color:red}";
      <CC>
        <CS>{[_, _2, _3, _4]}</CS>
        {<Box xcss={styles.danger} />}
      </CC>;
      const styles = {
        danger: "_syaz5scu _bfhk5scu",
        success: "_syazbf54 _bfhkbf54",
      };
      "
    `);
  });

  it('should transform css map even when the styles are defined below the component', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const Component = () => <div>
        <span css={styles.danger} />
        <span css={styles.success} />
      </div>

      const styles = cssMap(${styles});
    `);

    expect(actual).toIncludeMultiple([
      'const styles={danger:"_syaz5scu _bfhk5scu",success:"_syazbf54 _bfhkbf54"};',
      '<span className={ax([styles.danger])}/>',
      '<span className={ax([styles.success])}/>',
    ]);
  });

  it('should transform css map even with an empty object', () => {
    const actual = transform(`
        import { css, cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {},
          success: {
            color: 'green',
            backgroundColor: 'green'
          }
        });
      `);

    expect(actual).toInclude('const styles={danger:"",success:"_syazbf54 _bfhkbf54"};');
  });

  it('should transform ternary-based conditional referencing cssMap declarations', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        root: { display: 'block' },
        positive: { background: 'white', color: 'black' },
        negative: { background: 'green', color: 'red' },
        bold: { fontWeight: 'bold' },
        normal: { fontWeight: 'normal' },
      });

      const Component = ({ isPrimary, weight }) => (
        <div
          css={[
            styles.root,
            weight in styles ? styles[weight] : styles.normal,
            isPrimary ? styles.positive : styles.negative,
          ]}
        />
      );
    `);

    expect(actual).toIncludeMultiple([
      '._1e0c1ule{display:block}',
      '._bfhk1x77{background-color:white}',
      '._syaz11x8{color:black}',
      '._bfhkbf54{background-color:green}',
      '._syaz5scu{color:red}',
      '._k48p8n31{font-weight:bold}',
      '._k48p4jg8{font-weight:normal}',
      'const styles={root:"_1e0c1ule",positive:"_bfhk1x77 _syaz11x8",negative:"_bfhkbf54 _syaz5scu",bold:"_k48p8n31",normal:"_k48p4jg8"}',
      '<div className={ax([styles.root,weight in styles?styles[weight]:styles.normal,isPrimary?styles.positive:styles.negative])}/>',
    ]);
  });

  it('should error out if the root cssMap object is being directly called', () => {
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({ root: { color: 'red' } });

      // Eg. we expect 'styles.root' here instead of 'styles'
      <div css={styles} />
    `);
    }).toThrow(ErrorMessages.USE_VARIANT_OF_CSS_MAP);

    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      // Eg. we expect 'styles.root' here instead of 'styles'
      <div css={styles} />

      const styles = cssMap({ root: { color: 'red' } });
    `);
    }).toThrow(
      'This CallExpression was unable to have its styles extracted — try to define them statically using Compiled APIs instead'
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
