import { outdent } from 'outdent';

import { typeScriptTester as tester } from '../../../test-utils';
import { shorthandFirst } from '../index';

const packages = ['css', 'styled', 'cssMap', 'xcss'];

tester.run('shorthand-property-sorting', shorthandFirst, {
  valid: [
    ...packages.map((pkg) => ({
      name: `correct property ordering (${pkg})`,
      code: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const styles = ${pkg === 'styled' ? pkg + '.div' : pkg}({
        margin: '1', // 1
        border: '2', // 1
        borderBlock: '3', // 2
        borderBlockEnd: '4', // 3
        borderBlockStart: '5', // 4
        borderBottom: '6', // 5
        borderColor: '7', // 6
      });
      export const EmphasisText1 = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
    ...packages.map((pkg) => ({
      name: `incorrect property ordering, from unknown package (${pkg})`,
      code: outdent`
      import {${pkg}} from 'wrongpackage';

      const styles = ${pkg === 'styled' ? pkg + '.div' : pkg}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
    })),
  ],
  invalid: [
    ...packages.map((pkg) => ({
      name: `incorrect property ordering (${pkg})`,
      code: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const styles = ${pkg === 'styled' ? pkg + '.div' : pkg}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const styles = ${
        pkg === 'styled' ? pkg + '.div' : pkg
      }({ border: '#00b8d9', borderTop: '1px solid #00b8d9' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages.map((pkg) => ({
      name: `incorrect property ordering, inline (${pkg})`,
      code: outdent`
        import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

        const styles = ${
          pkg === 'styled' ? pkg + '.div' : pkg
        }({ borderTop: '1px solid #00b8d9', border: '#00b8d9' });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      output: outdent`
        import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

        const styles = ${
          pkg === 'styled' ? pkg + '.div' : pkg
        }({ border: '#00b8d9', borderTop: '1px solid #00b8d9' });
        export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
      `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    ...packages.map((pkg) => ({
      name: `incorrect property ordering, nested ObjectExpression (${pkg})`,
      code: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const containerAppearance = {
        default: ${pkg === 'styled' ? pkg + '.div' : pkg}({
          borderBlockEnd: '1px solid #00b8d9',
          borderBlock: '#00b8d9',
          border: '#00b8d9',
        }),
        success: ${pkg === 'styled' ? pkg + '.div' : pkg}({
          border: '#00b8d9',
          borderBlock: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
        }),
        inverse: ${pkg === 'styled' ? pkg + '.div' : pkg}({
          border: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
          borderBlock: '#00b8d9',
        }),
      };
    `,
      output: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const containerAppearance = {
        default: ${
          pkg === 'styled' ? pkg + '.div' : pkg
        }({ border: '#00b8d9', borderBlock: '#00b8d9', borderBlockEnd: '1px solid #00b8d9' }),
        success: ${pkg === 'styled' ? pkg + '.div' : pkg}({
          border: '#00b8d9',
          borderBlock: '#00b8d9',
          borderBlockEnd: '1px solid #00b8d9',
        }),
        inverse: ${
          pkg === 'styled' ? pkg + '.div' : pkg
        }({ border: '#00b8d9', borderBlock: '#00b8d9', borderBlockEnd: '1px solid #00b8d9' }),
      };
    `,
      errors: [{ messageId: 'shorthand-first' }, { messageId: 'shorthand-first' }],
    })),
    ...packages.map((pkg) => ({
      name: `6 reordering errors (${pkg})`,
      code: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const styles = ${pkg === 'styled' ? pkg + '.div' : pkg}({
        borderTop: '1px solid #00b8d9',
        border: '#00b8d9',
        borderColor: '#00b8d9',
        gridTemplate: '1fr 1fr',
        overscrollBehavior: 'contain',
        gridRow: '1 / 2',
        scrollMarginBlock: '10px',
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {${pkg}} from '${pkg === 'xcss' ? '@atlaskit/primitives' : '@compiled/react'}';

      const styles = ${
        pkg === 'styled' ? pkg + '.div' : pkg
      }({ border: '#00b8d9', overscrollBehavior: 'contain', gridTemplate: '1fr 1fr', scrollMarginBlock: '10px', gridRow: '1 / 2', borderColor: '#00b8d9', borderTop: '1px solid #00b8d9' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    })),
    {
      // doesn't retain comments WIP
      name: 'incorrect property ordering with comments (css)',
      code: outdent`
      import {css} from '@compiled/react';

      import { css } from '@compiled/react';
      const styles = css({
        borderTop: '1px solid #00b8d9', // 13
        border: '#00b8d9', // 1
      });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      output: outdent`
      import {css} from '@compiled/react';

      import { css } from '@compiled/react';
      const styles = css({ border: '#00b8d9', borderTop: '1px solid #00b8d9' });
      export const EmphasisText = ({ children }) => <span css={styles}>{children}</span>;
    `,
      errors: [{ messageId: 'shorthand-first' }],
    },
  ],
});
