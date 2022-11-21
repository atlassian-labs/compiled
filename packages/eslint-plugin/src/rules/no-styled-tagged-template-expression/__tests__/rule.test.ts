import { basename } from 'path';

import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  createTypedInvalidTestCase,
  typeScriptTester as tester
} from '../../../test-utils';
import { noStyledTaggedTemplateExpressionRule } from '../index';

const createComposedComponentTestCase = (test: RuleTester.InvalidTestCase) => {
  const replace = (str: string) => str.replace('styled.div', 'styled(Base)');

  return {
    ...test,
    filename: `composed-${basename(test.filename!)}.ts`,
    code: replace(test.code),
    output: replace(test.output!),
  };
};

type InvalidTestCase = Omit<RuleTester.InvalidTestCase, 'errors'>;

const replaceDeclaration = (str: string, prefix: string) =>
  str.replace('styled.div', prefix + 'styled.div');

const replaceAlias = (str: string) =>
  str
    .replace('styled }', 'styled as styled2 }')
    .replace('styled.div', 'styled2.div')
    .replace('styled(Base)', 'styled2(Base)');

const replaceType = (str: string) =>
  str.replace('styled.div', 'styled.div<{color: string}>');

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'unexpected' }],
    }))
    .flatMap((t) => [
      t,
      ...createDeclarationInvalidTestCases(t, 'Component', replaceDeclaration, replaceDeclaration),
    ])
    .flatMap((t) => [t, createComposedComponentTestCase(t)])
    .flatMap((t) => [t, createAliasedInvalidTestCase(t, replaceAlias, replaceAlias)])
    .flatMap((t) => [t, createTypedInvalidTestCase(t, replaceType, replaceType)]);

tester.run('no-styled-tagged-template-expression', noStyledTaggedTemplateExpressionRule, {
  valid: [
    `
      import { styled } from 'styled';

      styled.div\`color: blue\`;
    `,
    `
      import { styled } from '@compiled/react-clone';

      styled.div\`color: blue\`;
    `,
  ],
  invalid: createInvalidTestCases([
    {
      filename: 'single-line-static-rule.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`color: blue\`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: "blue"
        });
      `,
    },
    {
      filename: 'single-line-static-rule-comments.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`/* before */ color: /* inline */ blue /* after */\`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div\`/* before */ color: /* inline */ blue /* after */\`;
      `,
    },
    {
      filename: 'multiline-static-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div({
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div({
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div({
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        styled.div\`
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
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div\`
          color: \${color};
          opacity: \${opacity};
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div({
          color: color,
          opacity: opacity
        });
      `,
    },
    {
      filename: 'interpolated-declaration-values-comments.ts',
      code: `
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div\`
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
        import { styled } from '@compiled/react';

        const color = 'blue';
        const opacity = 1;

        styled.div\`
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
        import { styled } from '@compiled/react';

        const spacing = 8;

        styled.div\`
          margin: \${spacing}px \${spacing * 3}px;
          padding: calc(\${spacing} * 2);
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        const spacing = 8;

        styled.div({
          margin: \`\${spacing}px \${spacing * 3}px\`,
          padding: \`calc(\${spacing} * 2)\`
        });
      `,
    },
    {
      filename: 'mixins.ts',
      code: `
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div\`
          \${primary};
          opacity: 0.8;
          :hover {
            \${hover};
            opacity: 1;
          }
        \`;
      `,
      output: `
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div(
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
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div\`
          \${primary}
          opacity: 0.8;
          :hover {
            \${hover}
            opacity: 1
          }
        \`;
      `,
      output: `
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div(
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
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div\`
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
        import { css, styled } from '@compiled/react';

        const primary = css({ color: 'blue' });
        const hover = css({ textDecoration: 'underline' });

        styled.div\`
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
    {
      filename: 'dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          :hover {
            color: \${(props) => props.hoverColor};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: (props) => props.color,
          ":hover": {
            color: (props) => props.hoverColor
          }
        });
      `,
    },
    {
      filename: 'no-trailing-semicolon-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          :hover {
            color: \${(props) => props.hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div({
          color: (props) => props.color,
          ":hover": {
            color: (props) => props.hoverColor
          }
        });
      `,
    },
    {
      filename: 'dynamic-values-comments.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: /* before dynamic value 1 */ \${(props) => props.color} /* after dynamic value 1 */;
          :hover {
            color:
              /*
               * before dynamic value 2
               */
              \${(props) => props.hoverColor};
              /*
               * after dynamic value 2
               */
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: /* before dynamic value 1 */ \${(props) => props.color} /* after dynamic value 1 */;
          :hover {
            color:
              /*
               * before dynamic value 2
               */
              \${(props) => props.hoverColor};
              /*
               * after dynamic value 2
               */
          }
        \`;
      `,
    },
    {
      filename: 'conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          \${(props) => props.hidden && 'visibility: hidden'};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-conditional-rules.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'}
          \${(props) => props.hidden && 'visibility: hidden'};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            ":hover": (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
          }
        );
      `,
    },
    {
      filename: 'conditional-rules-comments.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          /* before conditional rule 1 */
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          /* after conditional rule 1 */
          /*
           * before conditional rule 2
           */
          \${(props) => props.hidden && 'visibility: hidden'};
          /*
           * after conditional rule 2
           */
          :hover {
            /* before conditional rule 3 */
            /* before conditional rule 3 copy */
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
            /* after conditional rule 3 */
            /* after conditional rule 3 copy */
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div\`
          /* before conditional rule 1 */
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          /* after conditional rule 1 */
          /*
           * before conditional rule 2
           */
          \${(props) => props.hidden && 'visibility: hidden'};
          /*
           * after conditional rule 2
           */
          :hover {
            /* before conditional rule 3 */
            /* before conditional rule 3 copy */
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
            /* after conditional rule 3 */
            /* after conditional rule 3 copy */
          }
        \`;
      `,
    },
    {
      filename: 'conditional-rules-before-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          \${(props) => props.hidden && 'visibility: hidden'};
          color: \${(props) => props.color};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
            color: \${(props) => props.hoverColor};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            color: (props) => props.color,
            ":hover": [
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
              {
                color: (props) => props.hoverColor
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-conditional-rules-before-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'}
          \${(props) => props.hidden && 'visibility: hidden'}
          color: \${(props) => props.color};
          :hover {
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'}
            color: \${(props) => props.hoverColor}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            color: (props) => props.color,
            ":hover": [
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto',
              {
                color: (props) => props.hoverColor
              }
            ]
          }
        );
      `,
    },
    {
      filename: 'conditional-rules-after-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'};
          \${(props) => props.hidden && 'visibility: hidden'};
          :hover {
            color: \${(props) => props.hoverColor};
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'};
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          {
            color: (props) => props.color
          },
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            ":hover": [
              {
                color: (props) => props.hoverColor
              },
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
            ]
          }
        );
      `,
    },
    {
      filename: 'no-trailing-semicolon-conditional-rules-after-dynamic-values.ts',
      code: `
        import { styled } from '@compiled/react';

        styled.div\`
          color: \${(props) => props.color};
          \${(props) => props.disabled ? "opacity: 0.8" : 'opacity: 1'}
          \${(props) => props.hidden && 'visibility: hidden'};
          :hover {
            color: \${(props) => props.hoverColor};
            \${(props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'}
          }
        \`;
      `,
      output: `
        import { styled } from '@compiled/react';

        styled.div(
          {
            color: (props) => props.color
          },
          (props) => props.disabled ? "opacity: 0.8" : 'opacity: 1',
          (props) => props.hidden && 'visibility: hidden',
          {
            ":hover": [
              {
                color: (props) => props.hoverColor
              },
              (props) => props.disabled ? "cursor: not-allowed" : 'cursor: auto'
            ]
          }
        );
      `,
    },
  ]),
});
