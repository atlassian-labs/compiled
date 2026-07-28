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
      const _5 = "._1UtDYzynoA{color:blue}";
      const _4 = "._0KLXruJwxv{background-color:green}";
      const _3 = "._1UtDYzJwxv{color:green}";
      const _2 = "._0KLXruGowl{background-color:red}";
      const _ = "._1UtDYzGowl{color:red}";
      const styles = {
        danger: "_1UtDYzGowl _0KLXruGowl",
        success: "_1UtDYzJwxv _0KLXruJwxv",
      };
      <CC>
        <CS>{[_, _2, _3, _4, _5]}</CS>
        {
          <div
            className={ax([foo && styles["danger"], props.foo && styles["danger"], styles.success, styles["danger"], styles[variant], styles[\`danger\`], styles[isDanger ? "danger" : "success"], styles["dang" + "er"], styles[props.variant], "_1UtDYzynoA"])}
          />
        }
      </CC>;
      "
    `);
  });
});
