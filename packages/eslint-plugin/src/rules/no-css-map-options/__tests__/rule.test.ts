import { outdent } from 'outdent';

import { tester } from '../../../test-utils';
import { noCssMapOptionsRule } from '../index';

tester.run('no-css-map-options', noCssMapOptionsRule, {
  valid: [
    {
      name: 'cssMap with no options',
      code: outdent`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'cssMap with no options from @atlaskit/css',
      code: outdent`
        import { cssMap } from '@atlaskit/css';

        const styles = cssMap({
          danger: {
            color: 'red',
          },
        });
      `,
    },
    {
      name: 'non-cssMap call with extra arguments is not flagged',
      code: outdent`
        import { css } from '@compiled/react';

        const styles = css({ color: 'red' }, { atomic: false });
      `,
    },
  ],
  invalid: [
    {
      name: 'should error when cssMap is called with atomic option',
      code: outdent`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
          },
        }, { atomic: false });
      `,
      errors: [{ messageId: 'noCssMapOptions' }],
    },
    {
      name: 'should error when cssMap is called with any options object',
      code: outdent`
        import { cssMap } from '@compiled/react';

        const styles = cssMap({
          danger: {
            color: 'red',
          },
        }, {});
      `,
      errors: [{ messageId: 'noCssMapOptions' }],
    },
    {
      name: 'should error when cssMap from @atlaskit/css is called with options',
      code: outdent`
        import { cssMap } from '@atlaskit/css';

        const styles = cssMap({
          danger: {
            color: 'red',
          },
        }, { atomic: false });
      `,
      errors: [{ messageId: 'noCssMapOptions' }],
    },
  ],
});
