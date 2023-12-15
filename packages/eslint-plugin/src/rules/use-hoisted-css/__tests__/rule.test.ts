import type { RuleTester } from 'eslint';

import { typeScriptTester as tester } from '../../../test-utils';
import { useHoistedCSSRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests.map((t) => ({
    ...t,
    errors: [{ messageId: 'unexpected' }],
  }));

tester.run('use-hoisted-css', useHoistedCSSRule, {
  valid: [
    `
        const styles = css({ color: token('color.text.danger') });

        <div css={styles}></div>
    `,
    `
        const baseStyles = css({ color: token('color.text.danger') });
        const disabledStyles = css({ color: token('color.text.disabled') });

        <div css={props.disabled ? disabledStyles : baseStyles}></div>
    `,
    `
        const styles1 = css({ color: 'blue' });
        const styles2 = css({ color: 'red' });
        const styles3 = css({ color: 'green' });

        <div css={[ styles1, styles2, styles3 ]}></div>
    `,
  ],
  invalid: createInvalidTestCases([
    {
      name: 'Directly add css() call to the css property of JSX element',
      code: `
            <div css={css({ color: 'red' })}></div>
        `,
    },
    {
      name: 'Directly add object to the css property of JSX element',
      code: `
            <div css={{ color: 'red' }}></div>
        `,
    },
    {
      name: 'Directly add object to the xcss property of JSX element',
      code: `
            <div xcss={{ color: 'red' }}></div>
        `,
    },
    {
      name: 'Directly add object to the cssMap property of JSX element',
      code: `
            <div cssMap={{ color: 'red' }}></div>
        `,
    },
    {
      name: 'Directly css call in a collection',
      code: `
            const styles1 = css({ color: 'blue' });
            const styles2 = css({ color: 'red' });

            <div css={[ styles1, styles2, css({ color: 'green' })]}></div>
        `,
    },
    {
      name: 'Direct object declaration in a collection',
      code: `
            const styles1 = css({ color: 'blue' });
            const styles2 = css({ color: 'red' });

            <div css={[ styles1, styles2, { color: 'green' }]}></div>
        `,
    },
  ]),
});
