import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
} from '../../../test-utils';
import { noCssTaggedTemplateExpressionRule } from '../index';

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const lastCssCallExpressionRe = /css\((?![\s\S]*css\()/g;

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'unexpected' }],
    }))
    .flatMap((t) => [
      t,
      ...createDeclarationInvalidTestCases(
        t,
        'styles',
        (code, prefix) => code.replace('css`', prefix + 'css`'),
        (output, prefix) =>
          // TODO remove this once comments are handled
          t.filename?.includes('comments')
            ? output.replace('css`', prefix + 'css`')
            : output.replace(lastCssCallExpressionRe, prefix + 'css(')
      ),
    ])
    .flatMap((t) => [
      t,
      createAliasedInvalidTestCase(
        t,
        (code) =>
          code
            .replace('{ css }', '{ css as css2 }')
            .replace('css`', 'css2`')
            .replace(/css\(/g, 'css2('),
        (output) =>
          output
            .replace('{ css }', '{ css as css2 }')
            .replace(/css\(/g, 'css2(')
            // TODO remove this once comments are handled
            .replace(/css`/g, 'css2`')
      ),
    ]);

tester.run('no-css-tagged-template-expression', noCssTaggedTemplateExpressionRule, {
  valid: [
    `
      import { css } from 'css';

      css\`color: blue\`;
    `,
    `
      import { css } from '@compiled/react-clone';

      css\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { css } from '@compiled/react';

        css\`color: blue\`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue"
        });
      `,
    },
    {
      filename: 'single-line-static-rule-comments.ts',
      code: `
        import { css } from '@compiled/react';

        css\`/* before */ color: /* inline */ blue /* after */\`;
      `,
      output: `
        import { css } from '@compiled/react';

        css\`/* before */ color: /* inline */ blue /* after */\`;
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          font-weight: 500;
          opacity: 0.8;
          :hover { opacity: 1; text-decoration: underline; }
          :visited { color: indigo; }
          :focus {
            color: darkblue;
            opacity: 1;
          }
          display: block;
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          fontWeight: 500,
          opacity: 0.8,
          ":hover": {
            opacity: 1,
            textDecoration: "underline"
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "darkblue",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-multiline-static-rules.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          font-weight: 500;
          opacity: 0.8;
          :hover { opacity: 1; text-decoration: underline }
          :visited { color: indigo }
          :focus {
            color: darkblue;
            opacity: 1
          }
          display: block
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          fontWeight: 500,
          opacity: 0.8,
          ":hover": {
            opacity: 1,
            textDecoration: "underline"
          },
          ":visited": {
            color: "indigo"
          },
          ":focus": {
            color: "darkblue",
            opacity: 1
          },
          display: "block"
        });
      `,
    },
    {
      filename: 'multiline-static-rules-comments.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          /* before declaration 1 */
          color: /* inline declaration 1 */ blue;
          /* after declaration 1 */
          /*
           * before declaration 2
           */
          font-weight:
            /*
             * inline declaration 2
             */
             500;
          /*
           * after declaration 2
           */
          /* before declaration 3 */
          opacity: /*
           * inline declaration 3
           */ 0.8;
          /* after declaration 3 */
          :hover { opacity: 1; text-decoration: underline; }
          :visited { color: indigo; }
          :focus {
            /* before declaration 4 */
            color: /* inline declaration 4 */ darkblue;
            /* after declaration 4 */
            /* before declaration 5 */
            opacity: /* inline declaration 5 */ 1;
            /*
             * after declaration 5
             */
          }
          /* before declaration 6 */
          display: /* inline declaration 6 */ block;
          /* after declaration 6 */
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css\`
          /* before declaration 1 */
          color: /* inline declaration 1 */ blue;
          /* after declaration 1 */
          /*
           * before declaration 2
           */
          font-weight:
            /*
             * inline declaration 2
             */
             500;
          /*
           * after declaration 2
           */
          /* before declaration 3 */
          opacity: /*
           * inline declaration 3
           */ 0.8;
          /* after declaration 3 */
          :hover { opacity: 1; text-decoration: underline; }
          :visited { color: indigo; }
          :focus {
            /* before declaration 4 */
            color: /* inline declaration 4 */ darkblue;
            /* after declaration 4 */
            /* before declaration 5 */
            opacity: /* inline declaration 5 */ 1;
            /*
             * after declaration 5
             */
          }
          /* before declaration 6 */
          display: /* inline declaration 6 */ block;
          /* after declaration 6 */
        \`;
      `,
    },
    {
      filename: 'nested-selectors.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          #foo {
            .bar {
              [data-testid="baz"] {
                :hover {
                  text-decoration: underline;
                }
              }
            }
          }
          @media screen and (max-width: 600px) {
            #foo {
              .bar {
                opacity: 0;
              }
            }
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css({
          color: "blue",
          "#foo": {
            ".bar": {
              [\`[data-testid="baz"]\`]: {
                ":hover": {
                  textDecoration: "underline"
                }
              }
            }
          },
          "@media screen and (max-width: 600px)": {
            "#foo": {
              ".bar": {
                opacity: 0
              }
            }
          }
        });
      `,
    },
    {
      filename: 'nested-selectors-comments.ts',
      code: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          /* before selector 1 */
          #foo {
            /*
             * before selector 2
             */
            .bar {
              /* before selector 3 */
              [data-testid="baz"] {
                :hover {
                  text-decoration: underline;
                }
              }
              /* after selector 3 */
            }
            /*
             * after selector 2
             */
          }
          /* after selector 1 */
          /* before media query */
          @media screen and (max-width: 600px) {
            #foo {
              .bar {
                opacity: 0;
              }
            }
          }
          /* after media query */
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        css\`
          color: blue;
          /* before selector 1 */
          #foo {
            /*
             * before selector 2
             */
            .bar {
              /* before selector 3 */
              [data-testid="baz"] {
                :hover {
                  text-decoration: underline;
                }
              }
              /* after selector 3 */
            }
            /*
             * after selector 2
             */
          }
          /* after selector 1 */
          /* before media query */
          @media screen and (max-width: 600px) {
            #foo {
              .bar {
                opacity: 0;
              }
            }
          }
          /* after media query */
        \`;
      `,
    },
    {
      filename: 'interpolated-declaration-values.ts',
      code: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css\`
          color: \${color};
          opacity: \${opacity};
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css({
          color: color,
          opacity: opacity
        });
      `,
    },
    {
      filename: 'interpolated-declaration-values-comments.ts',
      code: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css\`
          color: /* before interpolation 1 */ \${color} /* after interpolation 1 */;
          opacity:
            /*
             * before interpolation 2
             */
             \${opacity};
            /*
             * after interpolation 2
             */
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        css\`
          color: /* before interpolation 1 */ \${color} /* after interpolation 1 */;
          opacity:
            /*
             * before interpolation 2
             */
             \${opacity};
            /*
             * after interpolation 2
             */
        \`;
      `,
    },
    {
      filename: 'affixed-declaration-values.ts',
      code: `
        import { css } from '@compiled/react';

        const size = 8;

        css\`
          margin: \${size}px \${size * 3}px;
          padding: calc(\${size} * 2);
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const size = 8;

        css({
          margin: \`\${size}px \${size * 3}px\`,
          padding: \`calc(\${size} * 2)\`
        });
      `,
    },
    {
      filename: 'mixins.ts',
      code: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          \${primary};
          opacity: 0.8;
          :hover {
            \${hover};
            opacity: 1;
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css(
          primary,
          {
            opacity: 0.8,
            ":hover": [
              hover,
              {
                opacity: 1
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-mixins.ts',
      code: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          \${primary}
          opacity: 0.8;
          :hover {
            \${hover}
            opacity: 1
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css(
          primary,
          {
            opacity: 0.8,
            ":hover": [
              hover,
              {
                opacity: 1
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'mixins-comments.ts',
      code: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          /* before mixin 1 */
          \${primary};
          /* after mixin 1 */
          opacity: 0.8;
          :hover {
            /*
             * before mixin 2
             */
            \${hover};
            /*
             * after mixin 2
             */
            opacity: 1;
          }
        \`;
      `,
      output: `
        import { css } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        css\`
          /* before mixin 1 */
          \${primary};
          /* after mixin 1 */
          opacity: 0.8;
          :hover {
            /*
             * before mixin 2
             */
            \${hover};
            /*
             * after mixin 2
             */
            opacity: 1;
          }
        \`;
      `,
    },
  ]),
});
