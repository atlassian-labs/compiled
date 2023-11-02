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
    import { cx } from '@compiled/react';

    const styles = styleMap({
      text: { color: 'red' },
      bg: { background: 'blue' },
    });

    <Button innerXcss={cx(styles.text, styles.bg)} />;
  `,
    `
    // Ignore cx usage not from compiled
    const styles = styleMap({
      text: { color: 'red' },
      bg: { background: 'blue' },
    });

    const joinedStyles = cx(styles.text, styles.bg);

    <Button xcss={styles} />;
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
      import { cx } from '@compiled/react';

      const styles = styleMap({
        text: { color: 'red' },
        bg: { background: 'blue' },
      });

      const joinedStyles = cx(styles.text, styles.bg);

      <Button xcss={styles} />;
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
      import { cx } from '@compiled/react';

      const styles = styleMap({
        text: { color: 'red' },
        bg: { background: 'blue' },
      });

      const joinedStyles = cx(styles.text, styles.bg);

      <Button innerXcss={styles} />;
    `,
      errors: [{ messageId: 'local-cx-xcss' }],
    },
  ],
});
