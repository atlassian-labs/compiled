import type { RuleTester } from 'eslint';

import { typeScriptTester as tester } from '../../../test-utils';
import { useHoistedCSSRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests.map((t) => ({
    ...t,
    errors: [{ messageId: 'unexpected' }],
  }));

tester.run('no-styled-tagged-template-expression', useHoistedCSSRule, {
  valid: [
    `
        const styles = css({ color: token('color.text.danger') });

        <div css={styles}>
    `,
    `
        const baseStyles = css({ color: token('color.text.danger') });
        const disabledStyles = css({ color: token('color.text.disabled') });

        <div css={props.disabled ? disabledStyles : baseStyles}>
    `,
  ],
  invalid: createInvalidTestCases([
    {
      name: 'Directly add css() call to the css property of JSX element',
      code: `
            <div css={css({ color: 'red' })}>
        `,
    },
    {
      name: 'Directly add object to the css property of JSX element',
      code: `
            <div css={{ color: 'red' }}>
        `,
    },
  ]),
});
