import { outdent } from 'outdent';

import { typeScriptTester as tester } from '../../../test-utils';
import { noCssPropWithoutCssFunctionRule } from '../index';

tester.run(
  'no-css-prop-without-css-function',
  // Removing this error requires migrating to @typescript-eslint/rule-tester, which requires
  // changing moduleResolution in tsconfig.options.js to 'nodenext'
  // and upgrading typescript-eslint to v6
  //
  // @ts-ignore Argument of type 'RuleModule<string, [], RuleListener>' is not assignable to parameter of type 'RuleModule'.
  noCssPropWithoutCssFunctionRule,
  {
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
      // Logical expressions in the css attribute
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const Component = ({ myBoolean }) => <MyComponent css={myBoolean && styles} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = ({ myBoolean }) => <MyComponent css={[myBoolean && styles, otherStyles]} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = ({ myBoolean }) => <MyComponent css={[myBoolean || styles, otherStyles]} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = ({ myBoolean }) => <MyComponent css={[myBoolean ?? styles, otherStyles]} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = (props) => <MyComponent css={[props.myBoolean && styles, otherStyles]} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = ({ myBoolean }) => <MyComponent css={[myBoolean() && styles, otherStyles]} />;
      `,
      outdent`
      import React from 'react';
      import { css } from '@compiled/react';
      import { MyComponent } from './external-file';

      const styles = css({ color: 'yellow' });
      const otherStyles = css({ background: 'blue' });
      const Component = (props) => <MyComponent css={[props.myBoolean() && styles, otherStyles]} />;
      `,
    ],

    invalid: [
      {
        errors: [
          {
            messageId: 'functionParameterInvalidCssUsage',
          },
        ],
        code: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        const CoolComponent = (props) => {
          return <MyComponent css={props.styles} />;
        }
      `,
      },
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
      {
        // Inline object expression without function
        // with existing css import
        errors: [
          {
            messageId: 'noCssFunction',
          },
        ],
        code: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        <div css={{ backgroundColor: 'red' }} />;
              `,
        output: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        <div css={css({ backgroundColor: 'red' })} />;
      `,
      },
      {
        // Inline object expression without function
        // with existing css import, imported as something else
        errors: [
          {
            messageId: 'noCssFunction',
          },
        ],
        code: outdent`
        import React from 'react';
        import { css as css2 } from '@compiled/react';
        import { css } from 'example';

        css();

        <div css={{ backgroundColor: 'red' }} />;
              `,
        output: outdent`
        import React from 'react';
        import { css as css2 } from '@compiled/react';
        import { css } from 'example';

        css();

        <div css={css2({ backgroundColor: 'red' })} />;
      `,
      },
      {
        errors: [
          {
            messageId: 'noCssFunction',
          },
        ],
        code: outdent`
          import React from 'react';

          const coolStyles = {
              width: '5px',
          } as const;

          <div css={coolStyles} />;
        `,
        output: outdent`
          import React from 'react';
          import { css } from '@compiled/react';

          const coolStyles = css({
              width: '5px',
          });

          <div css={coolStyles} />;
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
      // Passing in an imported value when not using an HTML element
      {
        errors: [
          {
            messageId: 'importedInvalidCssUsage',
          },
        ],
        code: outdent`
          import React from 'react';
          import { css } from '@compiled/react';
          import { MyComponent, styles } from './external-file';

          <MyComponent css={styles} />;
        `,
      },
      // Passing in a function parameter when not using an HTML element
      {
        errors: [
          {
            messageId: 'functionParameterInvalidCssUsage',
          },
        ],
        code: outdent`
          import React from 'react';
          import { css } from '@compiled/react';
          import { MyComponent, styles } from './external-file';

          const CoolComponent = ({ styles }) => {
            return <MyComponent css={styles} />;
          }
        `,
      },
      {
        errors: [
          {
            messageId: 'functionParameterInvalidCssUsage',
          },
        ],
        code: outdent`
          import React from 'react';
          import { css } from '@compiled/react';
          import { MyComponent, styles } from './external-file';

          const CoolComponent = ({ styles = { color: blue } }) => {
            return <MyComponent css={styles} />;
          }
        `,
      },
      {
        errors: [
          {
            messageId: 'functionParameterInvalidCssUsage',
          },
        ],
        code: outdent`
        import React from 'react';
        import { css } from '@compiled/react';

        import { MyComponent } from './external-file';

        const myBoolean = true;
        const Component = ({ styles }) => <MyComponent css={myBoolean && styles} />;
        `,
      },
      {
        errors: [
          {
            messageId: 'functionParameterInvalidCssUsage',
          },
        ],
        code: outdent`
          import React from 'react';
          import { css } from '@compiled/react';
          import { MyComponent, styles } from './external-file';

          const CoolComponent = (styles) => {
            return <MyComponent css={styles} />;
          }
        `,
      },
      // Passing in a variable that doesn't exist
      {
        errors: [
          {
            messageId: 'otherInvalidCssUsage',
          },
        ],
        code: outdent`
          import React from 'react';
          import { css } from '@compiled/react';
          import { MyComponent } from './external-file';

          <MyComponent css={styles} />;
        `,
      },
    ],
  }
);
