import { transform } from '../test-utils';

describe('css builder', () => {
  it('should convert css properties to kebab-case with css prop', () => {
    const actual = transform(`
      import '@compiled/react';
      <div css={{ backgroundColor: 'red' }} />
    `);

    expect(actual).toInclude('background-color:red');
  });

  it('should convert css properties to kebab-case with styled function', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const MyDiv = styled.div({
        backgroundColor: 'red'
      });
      <MyDiv />
    `);

    expect(actual).toInclude('background-color:red');
  });

  it('should convert css properties to kebab-case with css func and css map', () => {
    const actual = transform(`
    import { css, cssMap } from '@compiled/react';
      const styles = cssMap({
        danger: {
          backgroundColor: 'red'
        },
        success: {
          backgroundColor: 'green'
        }
      });
      <div>
        <div css={styles.danger} />
        <div css={styles.success} />
      </div>
    `);

    expect(actual).toIncludeMultiple(['background-color:red', 'background-color:green']);
  });

  it('should preserve custom property name casing with css prop', () => {
    const actual = transform(`
      import '@compiled/react';
      <div css={{
        '--panelColor': 'red',
        '--panel-height': '600px',
        '--PANEL_WIDTH': 280,
       }} />
    `);

    expect(actual).toIncludeMultiple([
      '--panelColor:red',
      '--panel-height:600px',
      '--PANEL_WIDTH:280px',
    ]);
  });

  it('should preserve custom property name casing with styled function', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const MyDiv = styled.div({
        '--panelColor': 'red',
        '--panel-height': '600px',
        '--PANEL_WIDTH': 280,
      });
      <MyDiv />
    `);

    expect(actual).toIncludeMultiple([
      '--panelColor:red',
      '--panel-height:600px',
      '--PANEL_WIDTH:280px',
    ]);
  });

  it('should preserve custom property name casing with css func and css map', () => {
    const actual = transform(`
    import { css, cssMap } from '@compiled/react';
      const styles = cssMap({
        background: {
          '--panelColor': 'red',
        },
        dimensions: {
          '--panel-height': '600px',
          '--PANEL_WIDTH': 280,
        }
      });
      <div>
        <div css={styles.danger} />
        <div css={styles.success} />
      </div>
    `);

    expect(actual).toIncludeMultiple([
      '--panelColor:red',
      '--panel-height:600px',
      '--PANEL_WIDTH:280px',
    ]);
  });

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
});
