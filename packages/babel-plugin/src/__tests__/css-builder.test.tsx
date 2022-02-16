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

  it('Calculates a negative variable separately from a positive variable of the same value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';      
      const size = () => 8
      const gridSize = size();

      const LayoutRight = styled.aside\`
        margin-right: -\${gridSize * 5}px;
        margin-left: \${gridSize * 5}px;
      \`;

      <LayoutRight>Layout Right</LayoutRight>;
    `);

    expect(actual).toIncludeMultiple([
      'margin-right:var(--_1cakqv5)',
      'margin-left:var(--_1l3fmvo)',
      '"--_1l3fmvo": ix(gridSize * 5, "px")',
      '"--_1cakqv5": ix(-gridSize * 5, "px"',
    ]);

    expect(actual).toMatchInlineSnapshot(`
      "const _2 = \\"._18u01xn1{margin-left:var(--_1l3fmvo)}\\";
      const _ = \\"._2hwxsxb8{margin-right:var(--_1cakqv5)}\\";

      const size = () => 8;

      const gridSize = size();
      const LayoutRight = forwardRef(({ as: C = \\"aside\\", style, ...props }, ref) => (
        <CC>
          <CS>{[_, _2]}</CS>
          <C
            {...props}
            style={{
              ...style,
              \\"--_1cakqv5\\": ix(-gridSize * 5, \\"px\\"),
              \\"--_1l3fmvo\\": ix(gridSize * 5, \\"px\\"),
            }}
            ref={ref}
            className={ax([\\"_2hwxsxb8 _18u01xn1\\", props.className])}
          />
        </CC>
      ));
      "
    `);
  });
});
