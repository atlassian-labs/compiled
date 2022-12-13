import { tester } from '../../../test-utils';
import { noExportedCssRule } from '../index';

const indent = (level: number) => ' '.repeat(level * 2);

const styles = [
  () => 'css``',
  () => 'css({})',
  (level: number) => ['css`', indent(level + 1) + 'color: blue;', indent(level) + '`'].join('\n'),
  (level: number) =>
    ['css({', indent(level + 1) + 'color: "blue"', indent(level) + '})'].join('\n'),
];

const createAlias = (source: string) =>
  source.replace(/css/g, 'css2').replace('{ css2 }', '{ css as css2 }');

const level = 5;

const createTestCases = (importSource: string) =>
  styles
    .flatMap((createStyle) => [
      {
        code: `
          import { css } from '${importSource}';

          ${createStyle(level)};
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = ${createStyle(level)};
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          export const Component = () => (
            <div
              css={
                ${createStyle(level + 3)}
              }
            />
          );
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = ${createStyle(level)};

          export const Component = () => (
            <div css={styles} />
          );
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          export default () => (
            <div
              css={
                ${createStyle(level + 3)}
              }
            />
          );
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = ${createStyle(level)};

          export default () => (
            <div css={styles} />
          );
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          export const styles = ${createStyle(level)};
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          export const styles = primary;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          export const styles = {
            primary: ${createStyle(level + 1)},
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          export const styles = {
            primary,
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          export const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
              }
            }
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          export const styles = {
            primary: {
              text: {
                color,
              }
            }
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
          };

          export const primary = styles.primary;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primaryStyle = ${createStyle(level)};

          const styles = {
            primary: primaryStyle,
          };

          export const primary = styles.primary;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
              }
            }
          };

          export const primary = styles.primary.text.color;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          const styles = {
            primary: {
              text: {
                color,
              }
            }
          };

          export const primary = styles.primary.text.color;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
            foo: '',
          };

          export const foo = styles.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          const styles = {
            primary,
            foo: '',
          };

          export const foo = styles.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
                foo: '',
              }
            }
          };

          export const foo = styles.primary.text.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          const styles = {
            primary: {
              text: {
                color,
                foo: '',
              }
            }
          };

          export const foo = styles.primary.text.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          export { primary };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          export const styles = [primary];
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        // Note: Array indices are not inspected
        code: `
          import { css } from '${importSource}';

          const styles = [${createStyle(level)}];

          export const primary = styles[0];
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
          };

          export { styles };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          const styles = {
            primary,
          };

          export { styles };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              color: {
                text: ${createStyle(level + 3)},
              }
            }
          };

          export { styles };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const text = ${createStyle(level)};

          const styles = {
            primary: {
              color: {
                text,
              }
            }
          };

          export { styles };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
          };

          const primary = styles.primary;

          export { primary };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
              }
            }
          };

          const primary = styles.primary.text.color;

          export { primary };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
            foo: '',
          };

          const foo = styles.foo;

          export { foo };
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
                foo: '',
              }
            }
          };

          const foo = styles.primary.text.foo;

          export { foo };
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          export default ${createStyle(level)};
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          export default {
            primary: ${createStyle(level)}
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          export default {
            primary: {
              text: {
                color: ${createStyle(level)}
              }
            }
          };
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = ${createStyle(level)};

          export default styles;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
          };

          export default styles;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          const styles = {
            primary,
          };

          export default styles;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
              }
            }
          };

          export default styles;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          const styles = {
            primary: {
              text: {
                color,
              }
            }
          };

          export default styles;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
          };

          export default styles.primary;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          const styles = {
            primary,
          };

          export default styles.primary;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
              }
            }
          };

          export default styles.primary.text.color;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          const styles = {
            primary: {
              text: {
                color,
              }
            }
          };

          export default styles.primary.text.color;
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: ${createStyle(level + 1)},
            foo: '',
          };

          export default styles.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          const styles = {
            primary,
            foo: '',
          };

          export default styles.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const styles = {
            primary: {
              text: {
                color: ${createStyle(level + 3)},
                foo: '',
              }
            }
          };

          export default styles.primary.text.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const color = ${createStyle(level)};

          const styles = {
            primary: {
              text: {
                color,
                foo: '',
              }
            }
          };

          export default styles.primary.text.foo;
        `,
        errors: [],
      },
      {
        code: `
          import { css } from '${importSource}';

          const primary = ${createStyle(level)};

          export default [primary];
        `,
        errors: [{ messageId: 'unexpected' }],
      },
      {
        // Note: Array indices are not inspected
        code: `
          import { css } from '${importSource}';

          const styles = [${createStyle(level)}];

          export default styles[0];
        `,
        errors: [],
      },
      {
        code: `
          import { css, styled } from '${importSource}';

          const styles = ${createStyle(level)};

          export const Component = styled.div\`\${styles}\`;
        `,
        errors: [],
      },
      {
        code: `
          import { css, styled as styled2 } from '${importSource}';

          const styles = ${createStyle(level)};

          export const Component = styled2.div\`\${styles}\`;
        `,
        errors: [],
      },
      {
        code: `
          import { css, styled } from '${importSource}';

          const buttonStyle = css\`
            display: flex;
            align-items: center;
            justify-content: center;\`;

          export const Component = styled.button(buttonStyle);
        `,
        errors: [],
      },
      {
        code: `
          import { css, styled } from '${importSource}';

          export const Foo = styled.div\`
            color: black;
            \${({ isXEnabled }) => isXEnabled ? css\`width: 100px\` : undefined }\`
          `,
        errors: [],
      },
    ])
    .flatMap((test) => [
      test,
      {
        ...test,
        code: createAlias(test.code),
      },
    ]);

tester.run('no-exported-css', noExportedCssRule, {
  valid: [
    ...createTestCases('css'),
    ...createTestCases('@compiled/react-clone'),
    ...createTestCases('@compiled/react').filter(({ errors }) => !errors.length),
  ],
  invalid: createTestCases('@compiled/react').filter(({ errors }) => errors.length),
});
