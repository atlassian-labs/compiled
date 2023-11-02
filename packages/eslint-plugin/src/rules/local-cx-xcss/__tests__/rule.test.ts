import { typeScriptTester as tester } from '../../../test-utils';
import { localCXXCSSRule } from '../index';

tester.run('local-cx-xcss', localCXXCSSRule, {
  valid: [
    `
    import { cx } from '@compiled/react';

    <Component xcss={cx({})} />
  `,
    `
    import { cx } from '@compiled/react';

    <Component innerXcss={cx({})} />
  `,
    `
    import { cx, cssMap } from '@compiled/react';

    const styles = cssMap({
      text: { color: 'red' },
      bg: { background: 'blue' },
    });

    <Button innerXcss={cx(styles.text, styles.bg)} />;
  `,
    `
    // Ignore cx usage not from compiled
    const styles = cssMap({
      text: { color: 'red' },
      bg: { background: 'blue' },
    });

    const joinedStyles = cx(styles.text, styles.bg);

    <Button xcss={joinedStyles} />;
    `,
    `
    // Ignore cx usage not from compiled
      const styles = cx({});

      <Component xcss={styles} />
    `,
  ],
  invalid: [
    {
      code: `
      import { cx } from '@compiled/react';
      const styles = cx({});

      <Component xcss={styles} />
    `,
      errors: [{ messageId: 'local-cx-xcss' }],
    },
    {
      code: `
      import { cx, cssMap } from '@compiled/react';

      const styles = cssMap({
        text: { color: 'red' },
        bg: { background: 'blue' },
      });

      const joinedStyles = cx(styles.text, styles.bg);

      <Button xcss={joinedStyles} />;
    `,
      errors: [{ messageId: 'local-cx-xcss' }],
    },
    {
      code: `
      import { cx } from '@compiled/react';
      const styles = cx({});

      <Component innerXcss={styles} />
    `,
      errors: [{ messageId: 'local-cx-xcss' }],
    },
    {
      code: `
      import { cx, cssMap} from '@compiled/react';

      const styles = cssMap({
        text: { color: 'red' },
        bg: { background: 'blue' },
      });

      const joinedStyles = cx(styles.text, styles.bg);

      <Button innerXcss={joinedStyles} />;
    `,
      errors: [{ messageId: 'local-cx-xcss' }],
    },
  ],
});
