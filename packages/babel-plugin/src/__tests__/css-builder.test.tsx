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
      "const _2 = \\"._syaz1aj3{color:var(--_1ylxx6h)}\\";
      const _ = \\"._bfhk8ruw{background-color:var(--_agotg1)}\\";

      const getBackgroundColor = (color) => color;

      const color = baseColor;
      <CC>
        <CS>{[_, _2]}</CS>
        {
          <div
            className={ax([\\"_bfhk8ruw _syaz1aj3\\"])}
            style={{
              \\"--_agotg1\\": ix(getBackgroundColor(customBackgroundColor)),
              \\"--_1ylxx6h\\": ix(color),
            }}
          />
        }
      </CC>;
      "
    `);
  });
});
