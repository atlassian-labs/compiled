import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

// Add an example element so we can check the raw CSS styles
const EXAMPLE_USAGE = 'const Element = (variant) => <div css={styles[variant]} />;';

describe('css map advanced functionality (at rules, selectors object)', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  it('should support satisfies expressions in computed at-rule keys', () => {
    const actual = transform(`
      import type { MediaAboveLg } from '@atlaskit/css/at-rules/media-above-lg';
      import type { Container } from '@atlaskit/css/at-rules/container';
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        root: {
          padding: '2px',
          ['@media (min-width: 48rem)' satisfies MediaAboveLg]: { padding: '8px' },
          ['@container id (width > 100px)' satisfies Container]: { padding: '4px' },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      'const _6="@media (min-width:48rem){._34ApswJg58{padding-top:8px}._0NZneVJg58{padding-right:8px}._0jj4l6Jg58{padding-bottom:8px}._4af1G0Jg58{padding-left:8px}}";',
      'const _5="@container id (width > 100px){._1hIcazUNDJ{padding-top:4px}._3pZtLrUNDJ{padding-right:4px}._2IBldfUNDJ{padding-bottom:4px}._4l5TLWUNDJ{padding-left:4px}}";',
      'const _4="._2Zuz6Q4Jdh{padding-left:2px}";',
      'const styles={root:"_0Of8r24Jdh _1Znuxb4Jdh _1wydGW4Jdh _2Zuz6Q4Jdh _1hIcazUNDJ _3pZtLrUNDJ _2IBldfUNDJ _4l5TLWUNDJ _34ApswJg58 _0NZneVJg58 _0jj4l6Jg58 _4af1G0Jg58"};',
    ]);
  });

  it('should parse a mix of at rules and the selectors object', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        success: {
          color: '#0b0',
          '&:hover': {
            color: '#060',
          },
          '@media': {
            'screen and (min-width: 500px)': {
              fontSize: '10vw',
            },
          },
          selectors: {
            span: {
              color: 'lightgreen',
              '&:hover': {
                color: '#090',
              },
            },
          },
        },
        danger: {
          color: 'red',
          '&:hover': {
            color: 'darkred',
          },
          '@media': {
            'screen and (min-width: 500px)': {
              fontSize: '20vw',
            },
          },
          selectors: {
            span: {
              color: 'orange',
              '&:hover': {
                color: 'pink',
              },
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      // Styles from success variant
      '._1UtDYzW391{color:#0b0}',
      '._0clgaMy3n9:hover{color:#060}',
      '@media screen and (min-width:500px){._4jbzM08O8r{font-size:10vw}}',
      '._4keetJeHQz span{color:lightgreen}',
      '._2j91gUWZxS span:hover{color:#090}',

      // Styles from danger variant
      '._1UtDYzGowl{color:red}',
      '._0clgaMZine:hover{color:darkred}',
      '@media screen and (min-width:500px){._4jbzM0LxYj{font-size:20vw}}',
      '._4keetJ0axx span{color:orange}',
      '._2j91gUy8mA span:hover{color:pink}',

      'const styles={success:"_1UtDYzW391 _4keetJeHQz _2j91gUWZxS _0clgaMy3n9 _4jbzM08O8r",danger:"_1UtDYzGowl _4keetJ0axx _2j91gUy8mA _0clgaMZine _4jbzM0LxYj"}',
    ]);
  });

  it('should parse selectors object', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        success: {
          color: '#0b0',
          '&:hover': {
            color: '#060',
          },
        },
        danger: {
          color: 'red',
          selectors: {
            '&:first-of-type': {
              color: 'lightgreen',
              '&:hover': {
                color: '#090',
              },
            },
            // Hover on child element
            '& :hover': {
              color: 'orange',
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      // Styles from success variant
      '._1UtDYzW391{color:#0b0}',
      '._0clgaMy3n9:hover{color:#060}',

      // Styles from danger variant
      '._1UtDYzGowl{color:red}',
      '._1GZd6UeHQz:first-of-type{color:lightgreen}',
      '._1F0D3lWZxS:first-of-type:hover{color:#090}',
      '._0x6vii0axx :hover{color:orange}',

      'const styles={success:"_1UtDYzW391 _0clgaMy3n9",danger:"_1UtDYzGowl _1GZd6UeHQz _1F0D3lWZxS _0x6vii0axx"}',
    ]);
  });

  it('should error if duplicate selectors passed (inside selectors object and outside)', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: '#0b0',
            '&:hover': {
              color: '#060',
            },
            selectors: {
              '&:hover': {
                color: '#ff0',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTOR);
  });

  it('should error if duplicate selectors passed using different formats (mixing an identifier and a string literal)', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: '#0b0',
            // This wouldn't pass the type-checking anyway
            div: {
              color: '#060',
            },
            selectors: {
              'div': {
                color: '#ff0',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTOR);
  });

  it('should error if selector targeting current element is passed without ampersand at front', () => {
    // :hover (by itself) is identical to &:hover, believe it or not!
    // This is due to the parent-orphaned-pseudos plugin in @compiled/css.
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        success: {
          color: '#0b0',
          selectors: {
            ':hover': {
              color: 'aquamarine',
            },
          },
        },
      });
    `);
    }).toThrow(ErrorMessages.USE_SELECTORS_WITH_AMPERSAND);
  });

  it('should error if duplicate selectors passed using both the forms `&:hover` and `:hover`', () => {
    expect(() => {
      transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        success: {
          color: '#0b0',
          '&:hover': {
            color: 'cyan',
          },
          selectors: {
            ':hover': {
              color: 'aquamarine',
            },
          },
        },
      });
    `);
    }).toThrow(ErrorMessages.USE_SELECTORS_WITH_AMPERSAND);
  });

  it('should not error if selector has same name as property', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        success: {
          color: '#0b0',
          // All bets are off when we do not know what constitutes
          // a valid selector, so we give up in the selectors key
          selectors: {
            color: {
              color: 'pink',
            },
            fontSize: {
              background: 'blue',
            },
          },
          fontSize: '50px',
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzW391{color:#0b0}',
      '._2FVy3uy8mA color{color:pink}',
      '._4xu6EWynoA fontSize{background-color:blue}',
      '._4ya3eEHMkp{font-size:50px}',
      'const styles={success:"_1UtDYzW391 _4ya3eEHMkp _4xu6EWynoA _2FVy3uy8mA"}',
    ]);
  });

  it('should parse an at rule (@media)', () => {
    const permutations: string[] = [`screen`, `'screen'`];

    for (const secondHalf of permutations) {
      const actual = transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: 'red',
            '@media': {
              'screen and (min-width: 500px)': {
                color: 'blue',
              },
              ${secondHalf}: {
                color: 'pink',
              },
            },
          },
        });

        ${EXAMPLE_USAGE}
      `);

      expect(actual).toIncludeMultiple([
        '._1UtDYzGowl{color:red}',
        '@media screen and (min-width:500px){._00ceskynoA{color:blue}}',
        '@media screen{._0gIO46y8mA{color:pink}}',

        'const styles={success:"_1UtDYzGowl _0gIO46y8mA _00ceskynoA"}',
      ]);
    }
  });

  // TODO: add a unit test for the `@starting-style` at-rule when it is NOT nested. This is currently not working as
  // Compiled only supports processing at-rules that have two "halves", e.g. `@media screen`
  // When nested, the at-rule is not processed like an at-rule - it is processed like a CSS selector.
  it('should parse the @starting-style at-rule when nested', () => {
    const actual = transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: 'red',
            '@media (prefers-reduced-motion: no-preference)': {
              '@starting-style': {
                color: 'blue'
              },
            },
          },
        });

        ${EXAMPLE_USAGE}
      `);

    expect(actual).toIncludeMultiple([
      '._1UtDYzGowl{color:red}',
      '@media (prefers-reduced-motion:no-preference){@starting-style{._115yFoynoA{color:blue}}}',

      'const styles={success:"_1UtDYzGowl _115yFoynoA"}',
    ]);
  });

  it('should error if more than one selectors key passed', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: 'red',
            selectors: {
              '&:hover': {
                color: '#ff0',
              },
            },
            selectors: {
              '&:active': {
                color: '#0ff',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTORS_BLOCK);
  });

  it('should error if value of selectors key is not an object', () => {
    expect(() => {
      transform(`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          success: {
            color: 'red',
            selectors: 'blue',
          },
        });
      `);
    }).toThrow(ErrorMessages.SELECTORS_BLOCK_VALUE_TYPE);
  });

  it('should support @position-try global at-rule with nested syntax', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        arrow: {
          '@position-try': {
            '--ds-arrow-top': {
              positionArea: 'top',
              margin: 0,
            },
            '--ds-arrow-bottom': {
              positionArea: 'bottom',
              margin: 0,
            },
          },
          color: 'blue',
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      '"@position-try --ds-arrow-top{margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;position-area:top}"',
      '"@position-try --ds-arrow-bottom{margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;position-area:bottom}"',
      'color:blue',
    ]);
  });

  it('should support @position-try global at-rule with flat syntax', () => {
    const actual = transform(`
      import { cssMap } from '@compiled/react';

      const styles = cssMap({
        arrowBlockStart: {
          '@position-try --ds-arrow-block-start': {
            positionArea: 'block-start',
            margin: 0,
            marginBlockEnd: 'var(--ds-arrow-size, 8px)',
          },
        },
        arrowBlockEnd: {
          '@position-try --ds-arrow-block-end': {
            positionArea: 'block-end',
            margin: 0,
            marginBlockStart: 'var(--ds-arrow-size, 8px)',
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toIncludeMultiple([
      '"@position-try --ds-arrow-block-start{margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;position-area:block-start;margin-block-end:var(--ds-arrow-size,8px)}"',
      '"@position-try --ds-arrow-block-end{margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;position-area:block-end;margin-block-start:var(--ds-arrow-size,8px)}"',
    ]);
  });
});

describe('cssMapScoped advanced functionality (at rules, nested selectors)', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

  it('should parse a mix of at rules and the selectors object', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        success: {
          color: '#0b0',
          '&:hover': {
            color: '#060',
          },
          '@media': {
            'screen and (min-width: 500px)': {
              fontSize: '10vw',
            },
          },
          selectors: {
            span: {
              color: 'lightgreen',
              '&:hover': {
                color: '#090',
              },
            },
          },
        },
        danger: {
          color: 'red',
          '&:hover': {
            color: 'darkred',
          },
          '@media': {
            'screen and (min-width: 500px)': {
              fontSize: '20vw',
            },
          },
          selectors: {
            span: {
              color: 'orange',
              '&:hover': {
                color: 'pink',
              },
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    // Each variant gets a single cc- class — not split into atomic classes
    expect(actual).toContain('const styles={success:"cc-');
    expect(actual).toContain('danger:"cc-');
    // Styles are scoped under the cc- class
    expect(actual).toContain('.cc-');
    expect(actual).toContain(':hover');
    expect(actual).toContain('@media screen and (min-width:500px)');
    expect(actual).toContain('span');
  });

  it('should parse selectors object', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        success: {
          color: '#0b0',
          '&:hover': {
            color: '#060',
          },
        },
        danger: {
          color: 'red',
          selectors: {
            '&:first-of-type': {
              color: 'lightgreen',
              '&:hover': {
                color: '#090',
              },
            },
            '& :hover': {
              color: 'orange',
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toContain('const styles={success:"cc-');
    expect(actual).toContain('danger:"cc-');
    expect(actual).toContain(':first-of-type');
    expect(actual).toContain(':hover');
  });

  it('should error if duplicate selectors passed (inside selectors object and outside)', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: '#0b0',
            '&:hover': {
              color: '#060',
            },
            selectors: {
              '&:hover': {
                color: '#ff0',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTOR);
  });

  it('should error if duplicate selectors passed using different formats', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: '#0b0',
            div: {
              color: '#060',
            },
            selectors: {
              'div': {
                color: '#ff0',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTOR);
  });

  it('should error if selector targeting current element is passed without ampersand at front', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: '#0b0',
            selectors: {
              ':hover': {
                color: 'aquamarine',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.USE_SELECTORS_WITH_AMPERSAND);
  });

  it('should parse an at rule (@media)', () => {
    const permutations: string[] = [`screen`, `'screen'`];

    for (const secondHalf of permutations) {
      const actual = transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: 'red',
            '@media': {
              'screen and (min-width: 500px)': {
                color: 'blue',
              },
              ${secondHalf}: {
                color: 'pink',
              },
            },
          },
        });

        ${EXAMPLE_USAGE}
      `);

      expect(actual).toContain('const styles={success:"cc-');
      expect(actual).toContain('@media screen and (min-width:500px)');
      expect(actual).toContain('@media screen');
    }
  });

  it('should parse the @starting-style at-rule when nested', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        success: {
          color: 'red',
          '@media (prefers-reduced-motion: no-preference)': {
            '@starting-style': {
              color: 'blue'
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toContain('const styles={success:"cc-');
    expect(actual).toContain('@media (prefers-reduced-motion:no-preference)');
    expect(actual).toContain('@starting-style');
  });

  it('should error if more than one selectors key passed', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: 'red',
            selectors: {
              '&:hover': {
                color: '#ff0',
              },
            },
            selectors: {
              '&:active': {
                color: '#0ff',
              },
            },
          },
        });
      `);
    }).toThrow(ErrorMessages.DUPLICATE_SELECTORS_BLOCK);
  });

  it('should error if value of selectors key is not an object', () => {
    expect(() => {
      transform(`
        import { cssMapScoped } from '@compiled/react';

        const styles = cssMapScoped({
          success: {
            color: 'red',
            selectors: 'blue',
          },
        });
      `);
    }).toThrow(ErrorMessages.SELECTORS_BLOCK_VALUE_TYPE);
  });

  it('should pass through @keyframes untouched (no cc- prefix on keyframe stops)', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        animated: {
          '.spinner': {
            animationName: 'spin',
            animationDuration: '2s',
            '@keyframes spin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    // @keyframes stops (from/to) must NOT have cc- prefix — only .spinner gets scoped
    expect(actual).toContain('@keyframes spin{');
    // .spinner IS scoped under cc- class
    expect(actual).toContain('.cc-');
    expect(actual).toContain('.spinner{');
  });

  it('should support @position-try global at-rule with nested syntax', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        arrow: {
          '@position-try': {
            '--ds-arrow-top': {
              positionArea: 'top',
              margin: 0,
            },
            '--ds-arrow-bottom': {
              positionArea: 'bottom',
              margin: 0,
            },
          },
          color: 'blue',
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toContain('const styles={arrow:"cc-');
    expect(actual).toContain('@position-try --ds-arrow-top');
    expect(actual).toContain('@position-try --ds-arrow-bottom');
    expect(actual).toContain('color:blue');
  });

  it('should support @position-try global at-rule with flat syntax', () => {
    const actual = transform(`
      import { cssMapScoped } from '@compiled/react';

      const styles = cssMapScoped({
        arrowBlockStart: {
          '@position-try --ds-arrow-block-start': {
            positionArea: 'block-start',
            margin: 0,
            marginBlockEnd: 'var(--ds-arrow-size, 8px)',
          },
        },
        arrowBlockEnd: {
          '@position-try --ds-arrow-block-end': {
            positionArea: 'block-end',
            margin: 0,
            marginBlockStart: 'var(--ds-arrow-size, 8px)',
          },
        },
      });

      ${EXAMPLE_USAGE}
    `);

    expect(actual).toContain('arrowBlockStart:"cc-');
    expect(actual).toContain('arrowBlockEnd:"cc-');
    expect(actual).toContain('@position-try --ds-arrow-block-start');
    expect(actual).toContain('@position-try --ds-arrow-block-end');
  });
});
