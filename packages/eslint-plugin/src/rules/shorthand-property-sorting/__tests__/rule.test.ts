import { outdent } from 'outdent';

import { typeScriptTester as tester } from '../../../test-utils';
import { shorthandFirst } from '../index';

const packages_calls_and_imports = [
  ['css', 'css', '@atlaskit/css'],
  ['css', 'css', '@compiled/react'],
  ['styled', 'styled.div', '@compiled/react'],
  ['cssMap', 'cssMap', '@atlaskit/css'],
  ['cssMap', 'cssMap', '@compiled/react'],
];

const packages_and_calls = [
  ['css', 'css'],
  ['styled', 'styled.div'],
  ['cssMap', 'cssMap'],
];

tester.run('shorthand-property-sorting', shorthandFirst, {
  valid: [
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `correct property ordering, (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        margin: '1', // 1
        border: '2', // 1
        borderColor: '7', // 2
        borderBlock: '3', // 3
        borderBottom: '6', // 4
        borderBlockEnd: '4', // 5
        borderBlockStart: '5', // 5
      });
      export const EmphasisText1 = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
    ...packages_and_calls.map(([pkg, call]) => ({
      name: `incorrect property ordering, (${pkg}: from unregulated package)`,
      code: outdent`
      import {${pkg}} from 'wrongpackage';
      const styles = ${call}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `properties that don't interact with out of order depths (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        borderColor: '#00b8d9', // 2
        font: '#00b8d9', // 1
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `property not in bucket (${pkg}: '${imp}'`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        transitionDuration: '2', // unknown
        transition: 'fast', // 1
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
  ],
  invalid: [
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `incorrect property ordering (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ border: '#00b8d9', borderTop: '1px solid #00b8d9' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `incorrect property ordering -> 3 properties (${pkg}: '${imp}'`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        borderColor: '#00b8d9', // 2
        font: '#00b8d9', // 1
        border: '#00b8d9', // 1
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ font: '#00b8d9', border: '#00b8d9', borderColor: '#00b8d9' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `incorrect property ordering -> inline (${pkg}: '${imp}')`,
      code: outdent`
        import {${pkg}} from '${imp}';
        const styles = ${call}({ borderTop: '1px solid #00b8d9', border: '#00b8d9' });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      output: outdent`
        import {${pkg}} from '${imp}';
        const styles = ${call}({ border: '#00b8d9', borderTop: '1px solid #00b8d9' });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `incorrect property ordering -> nested ObjectExpression (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const containerAppearance = {
        default: ${call}({
          borderBlockEnd: '1px solid #00b8d9',
          borderBlock: '#00b8d9',
          border: '#00b8d9',
        }),
        success: ${call}({
          border: '#00b8d9',
          borderBlock: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
        }),
        inverse: ${call}({
          border: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
          borderBlock: '#00b8d9',
        }),
      };
    `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const containerAppearance = {
        default: ${call}({ border: '#00b8d9', borderBlock: '#00b8d9', borderBlockEnd: '1px solid #00b8d9' }),
        success: ${call}({
          border: '#00b8d9',
          borderBlock: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
        }),
        inverse: ${call}({ border: '#00b8d9', borderBlock: '#00b8d9', borderBlockEnd: '1px solid #00b8d9' }),
      };
    `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `incorrect property ordering -> 6 reordering errors (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
        borderColor: '#00b8d9',
        borderRight: '#00b8d9',
        gridTemplate: '1fr 1fr',
        gridRow: '1',
        borderBlockStart: '10px',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ border: '#00b8d9', borderColor: '#00b8d9', gridTemplate: '1fr 1fr', gridRow: '1', borderTop: '1px solid #00b8d9', borderRight: '#00b8d9', borderBlockStart: '10px' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `includes pseudo-selectors -> pseudo is out of order (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        '&:hover': {
            borderTop: '1px solid #00b8d9', // 4
            borderColor: 'red', // 2
            border: '1px solid #00b8d9', // 1
        },
        border: '1px solid #00b8d9', // 1
        borderColor: 'red', // 2
        borderTop: '1px solid #00b8d9', // 4
      })
      `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        '&:hover': { border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' },
        border: '1px solid #00b8d9', // 1
        borderColor: 'red', // 2
        borderTop: '1px solid #00b8d9', // 4
      })
      `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `includes pseudo-selectors -> non-pseduo are out of order (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        '&:hover': {
          border: '1px solid #00b8d9', // 1
          borderColor: 'red', // 2
          borderTop: '1px solid #00b8d9', // 4
        },
        borderTop: '1px solid #00b8d9', // 4
        borderColor: 'red', // 2
        border: '1px solid #00b8d9', // 1
      })
      `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ '&:hover': {
          border: '1px solid #00b8d9', // 1
          borderColor: 'red', // 2
          borderTop: '1px solid #00b8d9', // 4
        }, border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' })
      `,
      errors: [{ messageId: 'shorthand-first' }],
    })),

    /* fixer can't deal with nested fixing in one go. I've split this test into:
       pt1 with the first round of fixes,
       pt2 carrying on from the output of pt1.
    */
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `includes pseduo-selectors -> pseduo and non-pseduo are out of order pt1 (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({
        '&:hover': {
            borderTop: '1px solid #00b8d9', // 4
            borderColor: 'red', // 2
            border: '1px solid #00b8d9', // 1
        },
        borderTop: '1px solid #00b8d9', // 4
        borderColor: 'red', // 2
        border: '1px solid #00b8d9', // 1
      })
      `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ '&:hover': {
            borderTop: '1px solid #00b8d9', // 4
            borderColor: 'red', // 2
            border: '1px solid #00b8d9', // 1
        }, border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' })
      `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    })),
    ...packages_calls_and_imports.map(([pkg, call, imp]) => ({
      name: `includes pseduo-selectors -> pseduo and non-pseduo are out of order pt2 (${pkg}: '${imp}')`,
      code: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ '&:hover': {
            borderTop: '1px solid #00b8d9', // 4
            borderColor: 'red', // 2
            border: '1px solid #00b8d9', // 1
        }, border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' })
       `,
      output: outdent`
      import {${pkg}} from '${imp}';
      const styles = ${call}({ '&:hover': { border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' }, border: '1px solid #00b8d9', borderColor: 'red', borderTop: '1px solid #00b8d9' })
      `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
  ],
});
