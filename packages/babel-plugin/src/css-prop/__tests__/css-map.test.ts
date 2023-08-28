import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';

describe('css map behaviour', () => {
  beforeAll(() => {
    process.env.AUTOPREFIXER = 'off';
  });

  afterAll(() => {
    delete process.env.AUTOPREFIXER;
  });

  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  const styles = `
    import { css, cssMap } from '@compiled/react';

    const styles = cssMap({
      danger: {
        color: 'red',
        backgroundColor: 'red'
      },
      success: {
        color: 'green',
        backgroundColor: 'green'
      }
    });
  `;

  it('should evaluate css map with various syntactic patterns', () => {
    const actual = transform(
      `
        ${styles}
        <div css={[
          foo && styles['danger'], 
          props.foo && styles['danger'], 
          styles.success,
          styles['danger'],
          styles[variant],
          styles[\`danger\`],
          styles[isDanger?'danger':'success'],
          styles['dang' + 'er'],
          styles[props.variant],
          { color: 'blue' }
        ]} />;
      `,
      { pretty: true }
    );

    expect(actual).toMatchInlineSnapshot(`
        "import * as React from "react";
        import { ax, ix, CC, CS } from "@compiled/react/runtime";
        const _5 = "._syaz13q2{color:blue}";
        const _4 = "._bfhkbf54{background-color:green}";
        const _3 = "._syazbf54{color:green}";
        const _2 = "._bfhk5scu{background-color:red}";
        const _ = "._syaz5scu{color:red}";
        const styles = {
          danger: "_syaz5scu _bfhk5scu",
          success: "_syazbf54 _bfhkbf54",
        };
        <CC>
          <CS>{[_, _2, _3, _4, _5]}</CS>
          {
            <div
              className={ax([
                foo && styles["danger"],
                props.foo && styles["danger"],
                styles.success,
                styles["danger"],
                styles[variant],
                styles[\`danger\`],
                styles[isDanger ? "danger" : "success"],
                styles["dang" + "er"],
                styles[props.variant],
                "_syaz13q2",
              ])}
            />
          }
        </CC>;
        "
      `);
  });
});
