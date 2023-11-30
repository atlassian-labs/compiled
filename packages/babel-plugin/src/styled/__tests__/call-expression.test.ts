import { transform as transformCode } from '../../test-utils';
import type { TransformOptions } from '../../test-utils';

describe('styled object call expression', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { snippet: true, ...opts });

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
      "const _ = "._syaz13q2{color:blue}";
      const StyledComponent = styled.div({
        color: "blue",
      });
      const CompiledComponent = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmplp}
                style={__cmpls}
                ref={__cmplr}
                className={ax(["_syaz13q2", __cmplp.className])}
              />
            </CC>
          );
        }
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
      '{font-size:var(--_450x70)}',
      'const { textSize, ...__cmpldp } = __cmplp;',
      '"--_450x70": ix(`${__cmplp.textSize}px`)',
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
      '{font-size:var(--_8t6091)}',
      'const { textSize, ...__cmpldp } = __cmplp;',
      '"--_8t6091": ix(__cmplp.textSize, "px")',
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

    expect(actual).toIncludeMultiple(['{color:var(--_xexnhp)}', '"--_xexnhp": ix(__cmplp.color)']);
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
        width: ({ width }) => width ,
        minWidth: ({ width: w }) => w,
        maxWidth: (propz) => propz.width,
      });
    `);

    expect(actual).toInclude('ix(__cmplp.width)');
    expect(actual).not.toIncludeMultiple(['ix(propz.width)', 'ix(w)']);
  });

  it('should handle member expression pointing to a CSS call expression', () => {
    const actual = transform(`
      import { styled, css } from '@compiled/react';

      const styles = {
        default: css({
          color: 'black',
          fontWeight: 400
        }),
        success: css({
          color: 'green',
          fontWeight: 600
        }),
        fail: css({
          color: 'red',
          fontWeight: 600
        }),
        bg: css({
          background: 'white'
        }),
      };

      const Component = styled.div({
        ...styles.default,
        ...styles.bg
      });
    `);

    expect(actual).toIncludeMultiple(['color:black', 'font-weight:400', 'background-color:white']);
  });

  it('should transform variable in a nested template literal', () => {
    // this is the output of applying @atlaskit/tokens babel plugin
    // (as of v1.0.0) to some code similar to this:
    //     styled.div({
    //         backgroundColor: token('some.token', color),
    //     })

    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';

      const Component = styled.div({
        backgroundColor: \`var(--my-variable, \${color})\`,
      });
    `);

    expect(actual).toInclude('{background-color:var(--my-variable,red)}');
  });

  it('should transform variable in a heavily nested template literal', () => {
    // corresponds to
    //     styled.div({
    //         boxShadow: `0 8px ${token('some.token', color)}`
    //     })

    const actual = transform(`
      import { styled } from '@compiled/react';

      const color = 'red';

      const Component = styled.div({
        boxShadow: \`0 8px \${\`var(--my-variable, \${color})\`}\`,
      });
    `);

    expect(actual).toInclude('{box-shadow:0 8px var(--my-variable,red)}');
  });

  it('should transform variables within nested template literals that are all in an interpolation function', () => {
    // corresponds to
    //     styled.div<{ isActive: boolean }>({
    //         boxShadow: (props) =>
    //             props.isActive
    //                 ? `0 ${size}px ${token('some.token', color)}`
    //                 : token('some.other.token', color2),
    //     })

    const enableTypescript: TransformOptions = {
      parserBabelPlugins: ['typescript', 'jsx'],
    };

    const actual = transform(
      `
      import { styled } from '@compiled/react';

      const color = 'red';
      const color2 = 'blue';
      const size = 5;

      const Component = styled.div<{ isActive: boolean }>({
        boxShadow: (props) =>
            props.isActive
                ? \`0 \${size}px \${\`var(--my-variable, \${color})\`}\`
                : \`var(--my-other-variable, \${color2})\`,
      });
    `,
      enableTypescript
    );

    // We currently don't statically evaluate color, color2, or size here
    expect(actual).toMatchInlineSnapshot(`
      "const _2 = "._16qs1j0n{box-shadow:var(--my-other-variable,blue)}";
      const _ = "._16qslfrr{box-shadow:0 5px var(--my-variable,red)}";
      const color = "red";
      const color2 = "blue";
      const size = 5;
      const Component = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { isActive, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_, _2]}</CS>
              <C
                {...__cmpldp}
                style={__cmpls}
                ref={__cmplr}
                className={ax([
                  "",
                  __cmplp.isActive ? "_16qslfrr" : "_16qs1j0n",
                  __cmplp.className,
                ])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('should refuse to expand shorthand property when value is unknown at build time (arrow function)', () => {
    const actual = transform(`
    import { styled } from '@compiled/react';

    const Container = styled.div({
      padding: ({ customPadding }) => customPadding,
    });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _ = "._1yt414tu{padding:var(--_1hhnq9y)}";
      const Container = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { customPadding, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_]}</CS>
              <C
                {...__cmpldp}
                style={{
                  ...__cmpls,
                  "--_1hhnq9y": ix(__cmplp.customPadding),
                }}
                ref={__cmplr}
                className={ax(["_1yt414tu", __cmplp.className])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });

  it('should refuse to expand shorthand property when value is unknown at build time (ternary expression)', () => {
    const actual = transform(`
    import { styled } from '@compiled/react';

    const Container = styled.div({
      padding: ({ morePadding }) => morePadding ? morePadding : '4px 8px',
    });
    `);

    expect(actual).toMatchInlineSnapshot(`
      "const _5 = "._19bvftgi{padding-left:8px}";
      const _4 = "._n3td1y44{padding-bottom:4px}";
      const _3 = "._u5f3ftgi{padding-right:8px}";
      const _2 = "._ca0q1y44{padding-top:4px}";
      const _ = "._1yt41v0o{padding:var(--_1dm0vu2)}";
      const Container = forwardRef(
        ({ as: C = "div", style: __cmpls, ...__cmplp }, __cmplr) => {
          if (__cmplp.innerRef) {
            throw new Error("Please use 'ref' instead of 'innerRef'.");
          }
          const { morePadding, ...__cmpldp } = __cmplp;
          return (
            <CC>
              <CS>{[_, _2, _3, _4, _5]}</CS>
              <C
                {...__cmpldp}
                style={{
                  ...__cmpls,
                  "--_1dm0vu2": ix(__cmplp.morePadding),
                }}
                ref={__cmplr}
                className={ax([
                  "",
                  __cmplp.morePadding
                    ? "_1yt41v0o"
                    : "_ca0q1y44 _u5f3ftgi _n3td1y44 _19bvftgi",
                  __cmplp.className,
                ])}
              />
            </CC>
          );
        }
      );
      "
    `);
  });
});
