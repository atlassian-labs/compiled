import type { TransformOptions } from '../../test-utils';
import { transform as transformCode } from '../../test-utils';
import { ErrorMessages } from '../../utils/css-map';

// Add an example element so we can check the raw CSS styles
const EXAMPLE_USAGE = 'const Element = (variant) => <div css={styles[variant]} />;';

describe('css map advanced functionality (at rules, selectors object)', () => {
  const transform = (code: string, opts: TransformOptions = {}) =>
    transformCode(code, { pretty: false, ...opts });

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
      '._syazjafr{color:#0b0}',
      '._30l3aebp:hover{color:#060}',
      '@media screen and (min-width:500px){._1takoyl8{font-size:10vw}}',
      '._1tjq1v9d span{color:lightgreen}',
      '._yzbcy77s span:hover{color:#090}',

      // Styles from danger variant
      '._syaz5scu{color:red}',
      '._30l3qaj3:hover{color:darkred}',
      '@media screen and (min-width:500px){._1taki9ra{font-size:20vw}}',
      '._1tjqruxl span{color:orange}',
      '._yzbc32ev span:hover{color:pink}',

      'const styles={success:"_syazjafr _1tjq1v9d _yzbcy77s _30l3aebp _1takoyl8",danger:"_syaz5scu _1tjqruxl _yzbc32ev _30l3qaj3 _1taki9ra"}',
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
      '._syazjafr{color:#0b0}',
      '._30l3aebp:hover{color:#060}',

      // Styles from danger variant
      '._syaz5scu{color:red}',
      '._pnmb1v9d:first-of-type{color:lightgreen}',
      '._p685y77s:first-of-type:hover{color:#090}',
      '._838lruxl :hover{color:orange}',

      'const styles={success:"_syazjafr _30l3aebp",danger:"_syaz5scu _pnmb1v9d _p685y77s _838lruxl"}',
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
      '._syazjafr{color:#0b0}',
      '._14jq32ev color{color:pink}',
      '._1wsc13q2 fontSize{background-color:blue}',
      '._1wyb12am{font-size:50px}',
      'const styles={success:"_syazjafr _1wyb12am _1wsc13q2 _14jq32ev"}',
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
        '._syaz5scu{color:red}',
        '@media screen and (min-width:500px){._1qhm13q2{color:blue}}',
        '@media screen{._434732ev{color:pink}}',

        'const styles={success:"_syaz5scu _434732ev _1qhm13q2"}',
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
      '._syaz5scu{color:red}',
      '@media (prefers-reduced-motion:no-preference){@starting-style{._ff1013q2{color:blue}}}',

      'const styles={success:"_syaz5scu _ff1013q2"}',
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
});
