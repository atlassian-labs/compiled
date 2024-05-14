import { transform } from '../test-utils';

describe('import specifiers', () => {
  it('should evaluate simple expressions', () => {
    const actual = transform(`
      import '@compiled/react';

      <div css={{ fontSize: 8 * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:16px}');
  });

  it('should inline mutable identifier that is not mutated', () => {
    const actual = transform(`
      import '@compiled/react';

      let notMutatedAgain = 20;

      <div css={{ fontSize: notMutatedAgain }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:20px}');
  });

  it('should bail out evaluating expression referencing a mutable identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      let mutable = 2;
      mutable = 1;

      <div css={{ fontSize: mutable }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_i47brp)}');
  });

  it('should bail out evaluating identifier expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      let mutable = 2;
      const dontchange = mutable;
      mutable = 3;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_uta6jk)}');
  });

  it('should not exhaust the stack when an identifier references itself', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        let heading = heading || 20;

        <div css={{ marginLeft: \`\${heading.depth}rem\`, color: 'red' }}>hello world</div>
      `);
    }).not.toThrow();
  });

  it('should bail out evaluating expression that references a constant expression referencing a mutated expression', () => {
    const actual = transform(`
      import '@compiled/react';

      let mutable = false;
      const dontchange = mutable ? 1 : 2;
      mutable = true;

      <div css={{ fontSize: dontchange }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_uta6jk)}');
  });

  it('should bail out evaluating a binary expression referencing a mutated identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      let mutable = 2;
      mutable = 3;

      <div css={{ fontSize: mutable * 2 }}>hello world</div>
    `);

    expect(actual).toInclude('{font-size:var(--_1bs2x4k)}');
  });

  it('should not blow up when referencing local destructured args in arrow func', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        export const Component = ({ foo, color }) => {
          return (
            <span css={{ fontSize: foo, color, backgroundColor: 'blue' }} />
          );
        };
      `);
    }).not.toThrow();
  });

  it('should not blow up when referencing local args in arrow func', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        export const Component = (props) => {
          return (
            <span css={{ fontSize: props.foo, color: props.color, backgroundColor: 'blue' }} />
          );
        };
    `);
    }).not.toThrow();
  });

  it('should not blow up when referencing local destructured args in func', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        function Component({ foo, color }) {
          return (
            <span css={{ fontSize: foo, color, backgroundColor: 'blue' }} />
          );
        }
      `);
    }).not.toThrow();
  });

  it('should not blow up when referencing local args in func', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        function Component(props) {
          return (
            <span css={{ fontSize: props.foo, color: props.color, backgroundColor: 'blue' }} />
          );
        }
      `);
    }).not.toThrow();
  });

  it('should not blow up when destructured local args in func', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        function DestructuredComp(props) {
          const { foo, color } = props;

          return (
            <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
          );
        }
      `);
    }).not.toThrow();
  });

  it('handles object destructuring', () => {
    const actual = transform(`
      import '@compiled/react';

      const { foo, color } = { foo: 14, color: 'blue' };

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      }
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('statically evaluates deconstructed values from deeply nested objects', () => {
    const actual = transform(`
      import '@compiled/react';

      const theme = {
        borders: '1px solid black',
        colors: {
          light: {
            primary: '#fff',
          },
          dark: {
            primary: '#000',
          }
        },
        fonts: {
          small: '12px',
          weight: {
            bold: {
              headings: '700',
              body: '600'
            }
          }
        }
      };

      const { borders } = theme;
      const { small } = theme.fonts;
      const { primary } = theme.colors.dark;
      const { headings } = theme.fonts.weight.bold;

      function Component() {
        return (
          <span css={{
            border: borders,
            color: primary,
            fontSize: small,
            fontWeight: headings,
          }} />
        );
      }
    `);

    expect(actual).toIncludeMultiple([
      '{border:1px solid black}',
      '{color:#000}',
      '{font-size:12px}',
      '{font-weight:700}',
    ]);
  });

  it('handles the destructuring coming from an identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      const obj = { foo: 14, color: 'blue' };
      const { foo, color } = obj;

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      }
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('should build css template literal from the css api', () => {
    const actual = transform(`
      import { css } from '@compiled/react';

      const primary = css\`
        color: red;
      \`;

      <span css={primary} />
    `);

    expect(actual).toIncludeMultiple(['{color:red}']);
  });

  it('handles the destructuring coming from a referenced identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      const obj = { foo: 14, color: 'blue' };
      const bar = obj;
      const { foo, color } = bar;

      function Component() {
        return (
          <span css={{ fontSize: foo, color: color, backgroundColor: 'blue' }} />
        );
      }
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('handles the function call destructuring coming from a referenced identifier', () => {
    const actual = transform(`
      import '@compiled/react';

      const obj = { foo: () => ({ bar: 14 }), color: 'blue' };
      const bar = obj;
      const { foo, color } = bar;

      function Component() {
        return (
          <span css={{ fontSize: foo().bar, color: color, backgroundColor: 'blue' }} />
        );
      }
    `);

    expect(actual).toIncludeMultiple([
      '{font-size:14px}',
      '{color:blue}',
      '{background-color:blue}',
    ]);
  });

  it('should not blow up when member expression object is other than "Identifier" or "Call Expression"', () => {
    expect(() => {
      transform(`
        import '@compiled/react';

        function Component() {
          return (
            <span css={{ width: [{ bar: 10 }][0].bar }} />
          );
        }
      `);
    }).not.toThrow();
  });

  it('handles the computed object property with static evaluation of variable', () => {
    const actual = transform(`
      import { styled } from '@compiled/react';

      const media = '@media screen'
      const obj = { [media]: { color: 'blue' } };

      const Span = styled.span(obj);

      function Component() {
        return (
          <Span />
        );
      }
    `);

    expect(actual).toInclude('@media screen{._434713q2{color:blue}}');
  });

  it('handles the computed object property, where the variable in property is defined inside `as const` expression', () => {
    const actual = transform(
      `
        import '@compiled/react';

        const something = { large: '@media screen' } as const;

        <div css={{
          [something.large]: { color: 'blue' },
        }} />
      `,
      {
        parserBabelPlugins: ['typescript', 'jsx'],
      }
    );

    expect(actual).toInclude('@media screen{._434713q2{color:blue}}');
  });

  it('uses fallback node when evaluating a non expression returning a non static value', () => {
    const actual = transform(`
      import '@compiled/react';

      function getLineHeight() {
        return Math.random();
      }

      <span css={{lineHeight: getLineHeight()}} />
    `);

    expect(actual).toIncludeMultiple([
      '._vwz41rme{line-height:var(--_12w6gfj)',
      'ax(["_vwz41rme"])',
      '"--_12w6gfj": ix(getLineHeight())',
    ]);
  });

  describe('binary expresssions', () => {
    it('statically evaluates calculated value with identifier', () => {
      const actual = transform(`
        import '@compiled/react';

        const spacing = 8;

        <div css={{ marginTop: spacing * 2 }} />
      `);

      expect(actual).toIncludeMultiple(['._19pkexct{margin-top:16px}', 'ax(["_19pkexct"])']);
    });

    it('statically evaluates calculated value with nested binary', () => {
      const actual = transform(`
        import '@compiled/react';

        const spacing = 8;

        <div css={{ marginTop: spacing * 2 / 2 }} />
      `);

      expect(actual).toIncludeMultiple(['._19pkftgi{margin-top:8px}', 'ax(["_19pkftgi"])']);
    });

    it('statically evaluates calculated value with multiple identifiers', () => {
      const actual = transform(`
        import '@compiled/react';

        const one = 1;
        const two = 2;
        const three = 3;

        <div css={{ marginTop: one + two - three }} />
      `);

      expect(actual).toIncludeMultiple(['._19pkidpf{margin-top:0}', 'ax(["_19pkidpf"])']);
    });

    it('statically evaluates calculated value within calc utility', () => {
      const actual = transform(`
        import '@compiled/react';

        const spacing = 8;

        <div css={{ width: \`calc(100% - \${spacing * 2}px)\` }} />
      `);

      expect(actual).toIncludeMultiple([
        '._1bsbj0q6{width:calc(100% - 16px)}',
        'ax(["_1bsbj0q6"])',
      ]);
    });

    it('statically evaluates calculated value with string literal containing numeric value', () => {
      const actual = transform(`
        import '@compiled/react';

        const stringSpacing = '8';

        <div css={{ marginTop: stringSpacing * 2 }} />
      `);

      expect(actual).toIncludeMultiple(['._19pkexct{margin-top:16px}', 'ax(["_19pkexct"])']);
    });

    it('statically evaluates calculated value with unary expression', () => {
      const actual = transform(`
        import '@compiled/react';

        const getSpacing = () => 8;

        <div css={{ marginTop: -getSpacing() * 2 }} />
      `);

      expect(actual).toIncludeMultiple(['._19pk4h84{margin-top:-16px}', 'ax(["_19pk4h84"])']);
    });

    it('falls back to dynamic evaluation when non static value used', () => {
      const actual = transform(`
        import '@compiled/react';

        const getSpacing = () => Math.random();

        <div css={{ marginTop: getSpacing() * 2 }} />
      `);

      expect(actual).toIncludeMultiple([
        '._19pk19vg{margin-top:var(--_lb6tu)}',
        '"--_lb6tu": ix(getSpacing() * 2)',
        'ax(["_19pk19vg"])',
      ]);
    });

    it('statically evaluates a TS const expression', () => {
      const actual = transform(
        `
        import '@compiled/react';

        const styles = { color: 'red' } as const;

        <div css={{ ...styles }} />;
      `,
        {
          parserBabelPlugins: ['typescript', 'jsx'],
        }
      );

      expect(actual).toIncludeMultiple(['._syaz5scu{color:red}', 'ax(["_syaz5scu"])']);
    });

    it('statically evaluates a TS const expression in a resolved binding', () => {
      const actual = transform(
        `
        import { styled } from "@compiled/react";

        const style = {
          backgroundColor: 'red'
        } as const;

        const Component = styled.div({
          "input": style,
        });
      `,
        {
          parserBabelPlugins: ['typescript', 'jsx'],
        }
      );

      expect(actual).toIncludeMultiple([
        '._1rwq5scu input{background-color:red}',
        'ax(["_1rwq5scu", __cmplp.className]',
      ]);
    });

    it('should bail out evaluating non-exist call expression, which has member expression', () => {
      const actual = transform(`
      import '@compiled/react';

      <div css={{ marginTop: foo.bar() }} />
    `);

      expect(actual).toInclude('ix(foo.bar())');
    });
  });
});
