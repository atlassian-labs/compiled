import { transform } from '../test-utils';

describe('css builder', () => {
  it('should keep nested unconditional css together', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ '@media screen': { color: 'red', fontSize: 20 } }} />
    `);

    expect(actual).toInclude('@media screen{._43475scu{color:red}._1yzygktf{font-size:20px}}');
  });

  it('generates the correct style prop for shadowed runtime identifiers', () => {
    const actual = transform(`
      import '@compiled/react';

      const getBackgroundColor = (color) => color;
      const color = baseColor;

      <div css={{
        backgroundColor: getBackgroundColor(customBackgroundColor),
        color
      }} />
    `);

    // Make sure color is used over customBackgroundColor
    expect(actual).toIncludeMultiple(['{color:var(--_1ylxx6h)}', '"--_1ylxx6h": ix(color)']);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._syaz1aj3{color:var(--_1ylxx6h)}";
      const _ = "._bfhk8ruw{background-color:var(--_agotg1)}";
      const getBackgroundColor = (color) => color;
      const color = baseColor;
      <CC>
        <CS>{[_, _2]}</CS>
        {
          <div
            className={ax(["_bfhk8ruw _syaz1aj3"])}
            style={{
              "--_agotg1": ix(getBackgroundColor(customBackgroundColor)),
              "--_1ylxx6h": ix(color),
            }}
          />
        }
      </CC>;
      "
    `);
  });

  it('works with css map', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({ red: { color: 'red' }, blue: { color: 'blue' } });

      function Component({ color }) {
        return <div css={styles[color]} />
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _2 = "._syaz13q2{color:blue}";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        red: "_syaz5scu",
        blue: "_syaz13q2",
      };
      function Component({ color }) {
        return (
          <CC>
            <CS>{[_, _2]}</CS>
            {<div className={ax([styles[color]])} />}
          </CC>
        );
      }
      "
    `);
  });

  it('works in spite of a style override', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const styles = css({ color: ({ color }) => color });

      function Component({ color }) {
        return <div style={{ background: 'red' }} css={styles} />
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz1cj8{color:var(--_xexnhp)}";
      const styles = null;
      function Component({ color }) {
        return (
          <CC>
            <CS>{[_]}</CS>
            {
              <div
                className={ax(["_syaz1cj8"])}
                style={{
                  background: "red",
                  "--_xexnhp": ix((__cmplp) => __cmplp.color),
                }}
              />
            }
          </CC>
        );
      }
      "
    `);
  });

  it('works when there is a clear member expression', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const styles = {
        test: {
          red: css({ color: 'red' }),
          blue: css({ color: 'blue' }),
        },
      };

      function Component({ color }) {
        return <div css={styles.test.red} />
      }
    `);

    expect(actual).toMatchInlineSnapshot(`
      "import * as React from "react";
      import { ax, ix, CC, CS } from "@compiled/react/runtime";
      const _ = "._syaz5scu{color:red}";
      const styles = {
        test: {
          red: null,
          blue: null,
        },
      };
      function Component({ color }) {
        return (
          <CC>
            <CS>{[_]}</CS>
            {<div className={ax(["_syaz5scu"])} />}
          </CC>
        );
      }
      "
    `);
  });

  it('does not work when there is logic to get to the style', () => {
    const actual = () =>
      transform(`
      import { css } from '@compiled/react';

      const styles = {
        test: {
          red: css({ color: 'red' }),
          blue: css({ color: 'blue' }),
        },
      };

      function Component({ color }) {
        return <div style={{background: 'red'}} css={styles.test[color]} />
      }
    `);

    expect(actual).toThrow();
  });
});
