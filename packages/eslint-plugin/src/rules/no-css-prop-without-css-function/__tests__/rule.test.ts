import { outdent } from 'outdent';

import { tester } from '../../../test-utils';
import { noCssPropWithoutCssFunctionRule } from '../index';

tester.run('no-css-prop-without-css-function', noCssPropWithoutCssFunctionRule, {
  valid: [
    // Inline object expression
    outdent`
      import React from 'react';
      import { css } from '@compiled/react';

      <div css={css({ backgroundColor: 'red' })} />;
    `,
    // Inline template string
    outdent`
      import React from 'react';
      import { css } from '@compiled/react';

      <div css={css\`background-color: red;\`} />;
    `,
    // Variable object expression
    outdent`
      import React from 'react';
      import { css } from '@compiled/react';

      const styles = css({ backgroundColor: 'red' });

      <div css={styles} />;
    `,
    // Variable template string
    outdent`
      import React from 'react';
      import { css } from '@compiled/react';

      const styles = css\`background-color: red;\`;

      <div css={styles} />;
    `,
    // Imported value
    outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { styles } from './external-file';

      <div css={styles} />;
    `,
  ],
  invalid: [
    {
      // Inline object expression without function
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        <div css={{ backgroundColor: 'red' }} />;
              `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        <div css={css({ backgroundColor: 'red' })} />;
      `,
    },
    // Inline template string without function
    {
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        <div css={\`background-color: red;\`} />;
      `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        <div css={css\`background-color: red;\`} />;
      `,
    },
    // Variable object expression without function
    {
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        const styles = { backgroundColor: 'red' };

        <div css={styles} />;
      `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        const styles = css({ backgroundColor: 'red' });

        <div css={styles} />;
      `,
    },
    // Object spread expression without function
    {
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        const styles = { backgroundColor: 'red' };

        const spread = { ...styles, backgroundColor: 'green' };

        <div css={spread} />;
      `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        const styles = { backgroundColor: 'red' };

        const spread = css({ ...styles, backgroundColor: 'green' });

        <div css={spread} />;
      `,
    },
    // Conditional expression without function
    {
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        const styles = { backgroundColor: 'red' };

        <div css={[someBoolean && styles]} />;
      `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        const styles = css({ backgroundColor: 'red' });

        <div css={[someBoolean && styles]} />;
      `,
    },
    // Ternary without function
    {
      errors: [
        {
          messageId: 'noCssFunction',
        },
      ],
      code: outdent`
        import React from 'react';

        const styles = { backgroundColor: 'red' };

        <div css={[someBoolean ? styles : undefined]} />;
      `,
      output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        const styles = css({ backgroundColor: 'red' });

        <div css={[someBoolean ? styles : undefined]} />;
      `,
    },
  ],
});
