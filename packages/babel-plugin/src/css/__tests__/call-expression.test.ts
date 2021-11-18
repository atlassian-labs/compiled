import { transform } from '../../test-utils';

describe('css', () => {
  it('transforms an object call expression with static values', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      export const styles = css({ color: 'blue' });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const styles = {
        classNames: [\\"_syaz13q2\\"],
        css: \\"._syaz13q2{color:blue}\\",
        style: {},
      };
      "
    `);
  });

  it('transforms an object call expression with dynamic values', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      export const styles = css({ color });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const styles = {
        classNames: [\\"_syaz1aj3\\"],
        css: \\"._syaz1aj3{color:var(--_1ylxx6h)}\\",
        style: {
          \\"--_1ylxx6h\\": ix(color),
        },
      };
      "
    `);
  });

  it('transforms a dynamic object call expression', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const fontSize = () => 14
      const size = 11;

      export const getStyles = () => css({
        color: 'blue',
        fontSize: \`\${size / fontSize()}em\`,
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const fontSize = () => 14;

      const size = 11;
      export const getFontStyles = () => ({
        classNames: [\\"_1wyb1n2i\\"],
        css: \\"._1wyb1n2i{font-size:var(--_18sxijl)}\\",
        style: {
          \\"--_18sxijl\\": ix(size / fontSize(), \\"em\\"),
        },
      });
      "
    `);
  });

  it('transforms a string call expression with static values', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      export const styles = css('color: blue');
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const styles = {
        classNames: [\\"_syaz13q2\\"],
        css: \\"._syaz13q2{color:blue}\\",
        style: {},
      };
      "
    `);
  });

  it.todo('transforms a dynamic string call expression');

  it('transforms a static template literal call expression with no expressions', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      export const styles = css(\`color: blue\`);
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const styles = {
        classNames: [\\"_syaz13q2\\"],
        css: \\"._syaz13q2{color:blue}\\",
        style: {},
      };
      "
    `);
  });

  it.todo('transforms a template literal call expression with expressions');
  it.todo('transforms a dynamic template literal call expression');

  describe('referenced through a css prop', () => {
    it('transforms an inlined declaration with a single style', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        <div css={css({ color: 'blue' })} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const _ = \\"._syaz13q2{color:blue}\\";
        <CC>
          <CS>{[_]}</CS>
          {<div className={ax([\\"_syaz13q2\\"])} />}
        </CC>;
        "
      `);
    });

    it('transforms a declaration with a single style', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        const styles = css({ color: 'blue' });

        <div css={styles} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const styles = {
          classNames: [\\"_syaz13q2\\"],
          css: \\"._syaz13q2{color:blue}\\",
          style: {},
        };
        <CC>
          <CS>{[styles]}</CS>
          {<div className={ax([styles])} />}
        </CC>;
        "
      `);
    });

    it('transforms an inlined declaration with multiple styles', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        <div
          css={
            css({
              color: 'blue',
              display: 'flex',
              fontSize: 14,
            })
          }
        />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const _3 = \\"._1wybdlk8{font-size:14px}\\";
        const _2 = \\"._1e0c1txw{display:flex}\\";
        const _ = \\"._syaz13q2{color:blue}\\";
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {<div className={ax([\\"_syaz13q2 _1e0c1txw _1wybdlk8\\"])} />}
        </CC>;
        "
      `);
    });

    it('transforms a declaration with multiple styles', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        const styles = css({
          color: 'blue',
          display: 'flex',
          fontSize: 14,
        });

        <div css={styles} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const styles = {
          classNames: [\\"_syaz13q2 _1e0c1txw _1wybdlk8\\"],
          css: \\"._syaz13q2{color:blue}._1e0c1txw{display:flex}._1wybdlk8{font-size:14px}\\",
          style: {},
        };
        <CC>
          <CS>{[styles]}</CS>
          {<div className={ax([styles])} />}
        </CC>;
        "
      `);
    });

    it.only('transforms a dynamic declaration', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        const fontSize = () => 14
        const size = 11;

        export const getStyles = () => css({
          color: 'blue',
          fontSize: \`\${size / fontSize()}em\`,
        });

        <div css={getStyles()} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const fontSize = () => 14;

        const size = 11;
        export const getStyles = () => ({
          classNames: [\\"_syaz13q2 _1wyb1n2i\\"],
          css: \\"._syaz13q2{color:blue}._1wyb1n2i{font-size:var(--_18sxijl)}\\",
          style: {
            \\"--_18sxijl\\": ix(size / fontSize(), \\"em\\"),
          },
        });
        <CC>
          <CS>{[getStyles()]}</CS>
          {<div className={ax([getStyles()])} />}
        </CC>;
        "
      `);
    });

    it('transforms an inlined declaration with dynamic values', () => {
      const actual = transform(`
        import { useState } from 'react';
        import { css } from '@compiled/react';

        const color = 'blue';
        const fontSize = 14;

        const App = () => {
          const [display] = useState('flex');
          return (
            <div css={css({ color, display, fontSize: \`\${fontSize}px\` }) } />
          );
        };
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const _3 = \\"._1wyb25dk{font-size:var(--_1j2e0s2)}\\";
        const _2 = \\"._1e0c927q{display:var(--_1t0san0)}\\";
        const _ = \\"._syaz1aj3{color:var(--_1ylxx6h)}\\";
        const color = \\"blue\\";
        const fontSize = 14;

        const App = () => {
          const [display] = useState(\\"flex\\");
          return (
            <CC>
              <CS>{[_, _2, _3]}</CS>
              {
                <div
                  className={ax([\\"_syaz1aj3 _1e0c927q _1wyb25dk\\"])}
                  style={{
                    \\"--_1ylxx6h\\": ix(color),
                    \\"--_1t0san0\\": ix(display),
                    \\"--_1j2e0s2\\": ix(fontSize, \\"px\\"),
                  }}
                />
              }
            </CC>
          );
        };
        "
      `);
    });

    // TODO isDisabled && something ? :

    it('transforms an inlined conditionally applied declaration', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        <div
          css={
            isDisabled
              ? css({ cursor: 'not-allowed' })
              : css({
                  color: 'blue',
                  display: 'flex',
                  fontSize: 14,
                })
          }
        />;
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const _4 = \\"._1wybdlk8{font-size:14px}\\";
        const _3 = \\"._1e0c1txw{display:flex}\\";
        const _2 = \\"._syaz13q2{color:blue}\\";
        const _ = \\"._80om13gf{cursor:not-allowed}\\";
        <CC>
          <CS>{[_, _2, _3, _4]}</CS>
          {
            <div
              className={ax([
                isDisabled ? \\"_80om13gf\\" : \\"_syaz13q2 _1e0c1txw _1wybdlk8\\",
              ])}
            />
          }
        </CC>;
        "
      `);
    });

    it('transforms a conditionally applied declaration', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        const disabledStyles = css({
          cursor: 'not-allowed',
        });

        const enabledStyles = css({
          color: 'blue',
          display: 'flex',
          fontSize: 14,
        });

        <div css={isDisabled ? disabledStyles : enabledStyles} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const disabledStyles = {
          classNames: [\\"_80om13gf\\"],
          css: \\"._80om13gf{cursor:not-allowed}\\",
          style: {},
        };
        const enabledStyles = {
          classNames: [\\"_syaz13q2 _1e0c1txw _1wybdlk8\\"],
          css: \\"._syaz13q2{color:blue}._1e0c1txw{display:flex}._1wybdlk8{font-size:14px}\\",
          style: {},
        };
        <CC>
          <CS>{[disabledStyles, enabledStyles]}</CS>
          {<div className={ax([isDisabled ? disabledStyles : enabledStyles])} />}
        </CC>;
        "
      `);
    });

    it('transforms multiple inlined declarations', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        <div
          css={[
            css({ color: 'blue' }),
            css('font-size: 14'),
            css(\`display: flex\`),
          ]}
        />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const _3 = \\"._1e0c1txw{display:flex}\\";
        const _2 = \\"._1wyb1o8a{font-size:14}\\";
        const _ = \\"._syaz13q2{color:blue}\\";
        <CC>
          <CS>{[_, _2, _3]}</CS>
          {<div className={ax([\\"_syaz13q2\\", \\"_1wyb1o8a\\", \\"_1e0c1txw\\"])} />}
        </CC>;
        "
      `);
    });

    it('transforms multiple declarations', () => {
      const actual = transform(`
        import { css } from '@compiled/react';

        const styles1 = css({ color: 'blue' });
        const styles2 = css('font-size: 14');
        const styles3 = css(\`display: flex\`);

        <div css={[styles1, styles2, styles3]} />
      `);

      expect(actual).toMatchInlineSnapshot(`
        "const styles1 = {
          classNames: [\\"_syaz13q2\\"],
          css: \\"._syaz13q2{color:blue}\\",
          style: {},
        };
        const styles2 = {
          classNames: [\\"_1wyb1o8a\\"],
          css: \\"._1wyb1o8a{font-size:14}\\",
          style: {},
        };
        const styles3 = {
          classNames: [\\"_1e0c1txw\\"],
          css: \\"._1e0c1txw{display:flex}\\",
          style: {},
        };
        <CC>
          <CS>{[styles1, styles2, styles3]}</CS>
          {<div className={ax([styles1, styles2, styles3])} />}
        </CC>;
        "
      `);
    });
  });
});
