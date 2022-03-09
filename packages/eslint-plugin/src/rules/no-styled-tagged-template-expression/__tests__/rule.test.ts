import { basename } from 'path';

import type { RuleTester } from 'eslint';

import {
  createAliasedInvalidTestCase,
  createDeclarationInvalidTestCases,
  tester,
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

const createInvalidTestCases = (tests: InvalidTestCase[]) =>
  tests
    .map((t) => ({
      ...t,
      errors: [{ messageId: 'noStyledTaggedTemplateExpression' }],
    }))
    .flatMap((t) => [
      t,
      ...createDeclarationInvalidTestCases(t, 'Component', replaceDeclaration, replaceDeclaration),
    ])
    .flatMap((t) => [t, createComposedComponentTestCase(t)])
    .flatMap((t) => [t, createAliasedInvalidTestCase(t, replaceAlias, replaceAlias)]);

// TODO Handle comments
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
