import { transform } from '../../test-utils';

describe('styled object call expression', () => {
  it('only transforms @compiled/react usages', () => {
    const actual = transform(`
      import { styled as styled2 } from '@compiled/react';
      import styled from 'styled-components';

      const StyledComponent = styled.div({
        color: 'blue',
      });

      const CompiledComponent = styled2.div({
        color: 'blue',
      });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = \\"._syaz13q2{color:blue}\\";
      const StyledComponent = styled.div({
        color: \\"blue\\",
      });
      const CompiledComponent = forwardRef(
        ({ as: C = \\"div\\", style, ...props }, ref) => (
          <CC>
            <CS>{[_]}</CS>
            <C
              {...props}
              style={style}
              ref={ref}
              className={ax([\\"_syaz13q2\\", props.className])}
            />
          </CC>
        )
      );
      "
    `);
  });

  it('should respect the definition of pseudo element content ala emotion with double quotes', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        ':after': {
          content: '""',
        },
      });
    `);

    expect(actual).toInclude(':after{content:""}');
  });

  it('should respect the definition of pseudo element content ala emotion with single quotes', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        ':after': {
          content: "''",
        },
      });
    `);

    expect(actual).toInclude(":after{content:''}");
  });

  it('should respect the definition of pseudo element content ala styled components with no content', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        ':after': {
          content: '',
        },
      });
    `);

    expect(actual).toInclude(':after{content:""}');
  });

  it('should respect the definition of pseudo element content ala styled components with content', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        ':after': {
          content: '😎',
        },
      });
    `);

    expect(actual).toInclude(':after{content:"\\uD83D\\uDE0E"}');
  });

  it('should append "px" on numeric literals if missing', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        fontSize: 12,
      });
    `);

    expect(actual).toInclude('{font-size:12px}');
  });

  it('should reference property access expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let color = { blue: 'red' };
      color = {};

      styled.div({
        background: color.blue,
      });
    `);

    expect(actual).toIncludeMultiple([
      '{background:var(--_1mkyvve)}',
      '"--_1mkyvve": ix(color.blue)',
    ]);
  });

  it('should not pass down invalid html attributes to the node when property has a suffix', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const ListItem = styled.div({
        fontSize: props => \`\${props.textSize}px\`,
      });
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_7wpnv5)}',
      '{ as: C = "div", style, textSize, ...props }',
      '"--_7wpnv5": ix(`${textSize}px`)',
    ]);
  });

  it('should not pass down invalid html attributes to the node when property has a suffix when func in template literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      const ListItem = styled.div({
        fontSize: \`\${props => props.textSize}px\`,
      });
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:var(--_fb92co)}',
      '{ as: C = "div", style, textSize, ...props }',
      '"--_fb92co": ix(textSize, "px")',
    ]);
  });

  it('should transform object with simple values', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        color: 'blue',
        marginLeft: 0,
      });
    `);

    expect(actual).toIncludeMultiple(['{color:blue}', '{margin-left:0}']);
  });

  it('should transform object with nested object into a selector', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        ':hover': {
          color: 'blue',
          marginLeft: 0,
        },
      });
    `);

    expect(actual).toIncludeMultiple([':hover{color:blue}', ':hover{margin-left:0}']);
  });

  it('should resolve identifier pointing to a call expression if it returns simple value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const em = (str) => str;
      const color = em('blue');

      const ListItem = styled.div({
        color,
      });
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should inline call if it returns simple value', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const em = (str) => str;

      const ListItem = styled.div({
        color: em('blue'),
      });
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should inline constant string literal', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'blue';

      const ListItem = styled.div({
        color,
      });
    `);

    expect(actual).toInclude('{color:blue}');
  });

  it('should transform template object with prop reference', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const ListItem = styled.div({
        color: props => props.color,
      });
    `);

    expect(actual).toIncludeMultiple(['{color:var(--_1p69eoh)}', '"--_1p69eoh": ix(props.color)']);
  });

  it('should transform object spread from variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const h100 = { fontSize: '12px' };

      const ListItem = styled.div({
        ...h100,
        color: 'red',
      });
    `);

    expect(actual).toIncludeMultiple(['{font-size:12px}', '{color:red}']);
  });

  it('should transform object with mutable identifier', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      let color = 'blue';
      color = 'red';

      const ListItem = styled.div({
        color: color,
      });
    `);

    expect(actual).toIncludeMultiple(['{color:var(--_1ylxx6h)}', '"--_1ylxx6h": ix(color)']);
  });

  it('should transform object with obj variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const hover = { color: 'red' };

      const ListItem = styled.div({
        fontSize: '20px',
        ':hover': hover,
      });
    `);

    expect(actual).toIncludeMultiple(['{font-size:20px}', ':hover{color:red}']);
  });

  it('should transform object with no argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const mixin = () => ({ color: 'red' });

      const ListItem = styled.div({
        ...mixin(),
      });
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with no argument function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      function mixin() {
        return { color: 'red' };
      }

      const ListItem = styled.div({
        ...mixin(),
      });
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform object with no argument functions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const bgColor = 'blue';
      const fontStyling = {
        style: 'italic',
        family: 'sans-serif',
      };

      const mixin1 = () => ({ color: 'red', backgroundColor: bgColor });
      const mixin2 = function() { return { fontStyle: fontStyling.style } };
      function mixin3() { return { fontFamily: fontStyling.family } };

      const ListItem = styled.div({
        color: 'blue',
        ':hover': mixin1(),
        ...mixin2(),
        ...mixin3(),
      });
    `);

    expect(actual).toIncludeMultiple([
      '{color:blue}',
      '{font-style:italic}',
      '{font-family:sans-serif}',
      ':hover{color:red}',
      ':hover{background-color:blue}',
    ]);
  });

  it('should transform object with no argument function properties belonging to a variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const bgColor = 'blue';
      const fontSize = 12;
      const fontStyling = {
        weight: 500
      };

      const sizes = {
        mixin1: () => \`1px solid \${bgColor}\`,
        mixin2: () => ({ fontSize }),
        mixin3: function() {return {fontWeight: fontStyling.weight};}
      };

      const ListItem = styled.div({
        color: 'blue',
        border: sizes.mixin1(),
        ...sizes.mixin2(),
        ...sizes.mixin3()
      });
    `);

    expect(actual).toIncludeMultiple([
      '{color:blue}',
      '{border:1px solid blue}',
      '{font-size:12px}',
      '{font-weight:500}',
    ]);
  });

  it('should transform object with argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const color1 = 'black';
      const mixin = ({ color1, color2: c }, color3, radius) => ({
        color: color1,
        backgroundColor: c,
        borderColor: color3 ,
        borderRadius: radius,
      });

      const color = { red: 'red' };
      const greenColor = 'green';

      const ListItem = styled.div({
        ...mixin({ color1: color.red, color2: 'blue' }, greenColor, 10)
      });
    `);

    expect(actual).toIncludeMultiple([
      '{color:red}',
      '{background-color:blue}',
      '{border-color:green}',
      '{border-radius:10px}',
    ]);
  });

  it('should transform object with unresolved argument arrow function variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const radius = 10;
      const mixin = (color1, radius, size, weight) => ({
        color: color1,
        borderRadius: radius,
        fontSize: size,
        fontWeight: weight
      });

      const ListItem = styled.div({
        ...mixin(props.color1, radius)
      });
    `);

    expect(actual).toIncludeMultiple([
      '{color:var(--_zo7lop)}',
      '"--_zo7lop": ix(props.color1)',
      '{border-radius:10px}',
      '{font-weight:var(--_u6vle4)}',
      '"--_u6vle4": ix()',
      '{font-size:var(--_kre2x8)}',
      '"--_kre2x8": ix()',
    ]);
  });

  it('should transform object with argument arrow function variable inside member expression', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const mixin = {
        value: (color1, r, color2) => ({
          color: color1,
          borderRadius: r,
          borderColor: color2,
        })
      }

      const radius = 10;

      const ListItem = styled.div({
        ...mixin.value(props.color1, radius, 'red')
      });
    `);

    expect(actual).toIncludeMultiple([
      '"--_zo7lop": ix(props.color1)',
      '{border-radius:10px}',
      '{border-color:red}',
    ]);
  });

  it('should transform function returning an object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import React from 'react';

      const color = 'red';
      const mixin = () => ({ color });

      const ListItem = styled.div({
        color: mixin().color,
      });
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should transform member expression referencing a function which returns an object', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import React from 'react';

      const color = 'red';
      const mixin = () => ({ color });

      const colors = mixin();

      const ListItem = styled.div({
        color: colors.color,
      });
    `);

    expect(actual).toInclude('{color:red}');
  });

  it('should handle destructuring in interpolation functions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import colors from 'colors';

      export const BadgeSkeleton = styled.span({
        backgroundColor: ({ isLoading }) => isLoading ? colors.N20 : colors.N40,
        color: ({ loading: l }) => l ? colors.N50 : colors.N10,
        borderColor: (propz) => propz.loading ? colors.N100 : colors.N200,
      });
    `);

    expect(actual).not.toInclude('propz.loading ? colors.N100 : colors.N200');

    expect(actual).toIncludeMultiple([
      'isLoading ? colors.N20 : colors.N40',
      'l ? colors.N50 : colors.N10',
      'props.loading ? colors.N100 : colors.N200',
    ]);
  });

  it('should not use the destructured name to prevent naming collisions', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';
      import colors from 'colors';

      export const BadgeSkeleton = styled.span({
        backgroundColor: ({ isLoading }) => isLoading ? colors.N20 : colors.N40,
        color: ({ loading: l }) => l ? colors.N50 : colors.N10,
        borderColor: (propz) => propz.loading ? colors.N100 : colors.N200,
      });
    `);

    expect(actual).toInclude('{ as: C = "span", style, isLoading, loading: l, ...props }');
  });
});
