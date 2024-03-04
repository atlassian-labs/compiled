import { parse } from '@babel/parser';
import type { NodePath, TraverseOptions } from '@babel/traverse';
import traverse from '@babel/traverse';
import type * as t from '@babel/types';
import { format } from 'prettier';

import { PROPS_IDENTIFIER_NAME as P_NAME } from '../../constants';
import { normalizePropsUsage } from '../normalize-props-usage';

type ComponentPath = NodePath<t.CallExpression> | NodePath<t.TaggedTemplateExpression>;
type TraverseState = { result: ComponentPath | undefined };

describe('normalizePropsUsage', () => {
  const testSetupVisitor = {
    'CallExpression|TaggedTemplateExpression'(this: TraverseState, path: ComponentPath) {
      normalizePropsUsage(path);
      this.result = path;
      path.stop();
    },
  };

  const transform = (code: string) => {
    const ast = parse(code);
    const state: TraverseState = { result: undefined };

    traverse(ast, testSetupVisitor as TraverseOptions, undefined, state);

    return format(state.result?.toString() || '', { parser: 'babel-ts' })
      .replace(/\n/g, '')
      .replace(/\s+/g, ' ');
  };

  it(`renames props param to ${P_NAME}`, () => {
    const actual = transform(`
        styled.div({
            color: (p) => p.color,
        });
    `);

    expect(actual).toInclude(`(${P_NAME}) => ${P_NAME}.color`);
  });

  describe('destructured props', () => {
    it('reconstructs destructured props param', () => {
      const actual = transform(
        `styled.div(({ customColor }) => ({ backgroundColor: customColor }));`
      );

      expect(actual).toInclude(`(${P_NAME}) => ({ backgroundColor: ${P_NAME}.customColor,}))`);
    });

    it('reconstructs destructured props param with logical expression', () => {
      const actual = transform(`
        styled.div(({ width }) => width && { width });
    `);

      expect(actual).toInclude(`(${P_NAME}) => ${P_NAME}.width && { width: ${P_NAME}.width, }`);
    });

    it('reconstructs nested destructured props param', () => {
      const actual = transform(`
        styled.div\`
            color: \${({ theme: { colors: { dark } } }) => dark ? dark.red : 'black'};
        \`;
    `);

      expect(actual).toInclude(
        `(${P_NAME}) => ${P_NAME}.theme.colors.dark ? ${P_NAME}.theme.colors.dark.red : "black"`
      );

      const actual2 = transform(`
        styled.div({
          color: ({ theme: { colors: { dark } } }) => dark ? dark.red : 'black',
        });
      `);

      expect(actual2).toInclude(
        `(${P_NAME}) => ${P_NAME}.theme.colors.dark ? ${P_NAME}.theme.colors.dark.red : "black"`
      );
    });

    describe('rest element', () => {
      it('reconstructs destructured rest element', () => {
        const actual = transform(`
        styled.div({
          height: ({ width, ...rest }) => rest.height,
        });
    `);

        expect(actual).toInclude(`height: (${P_NAME}) => ${P_NAME}.height`);
      });

      it('reconstructs nested destructured rest element', () => {
        const actual = transform(`
        styled.div({
          color: ({ theme: { colors: {dark, ...rest} } }) => rest.light,
        });
    `);

        expect(actual).toInclude(`color: (${P_NAME}) => ${P_NAME}.theme.colors.light`);
      });
    });

    describe('deconstructing arrays in props', () => {
      it('throws an error when deconstructing arrays in props', () => {
        const actual = () => {
          transform(`
            styled.div({
              width: ({ a: [, second] }) => \`\${second}px\`,
            });
          `);
        };

        expect(actual).toThrow(
          'Compiled does not support arrays given in the parameters of an arrow function.'
        );
      });
    });

    describe('default parameters', () => {
      it('reconstructs default parameters in props', () => {
        // Each parameter is in a separate embedded expression
        const actual = transform(`
        styled.div({
          padding: ({ a, b = 16 }) => \`\${b}px \${a}px\`,
        });
        `);

        expect(actual).toInclude(`(${P_NAME}) => \`\${${P_NAME}.b ?? 16}px \${${P_NAME}.a}px\``);

        // Both parameters are in the same embedded expression
        const actual2 = transform(`
        styled.div({
          padding: ({ a, b = 16 }) => \`\${a + b}px\`,
        });
        `);

        expect(actual2).toInclude(`(${P_NAME}) => \`\${${P_NAME}.a + (${P_NAME}.b ?? 16)}px\``);
      });

      it('reconstructs default parameters in nested props', () => {
        const actual = transform(`
        styled.div({
          color: ({ theme: { colors: {dark = '#aaa', ...rest} } }) => dark,
        });
        `);

        expect(actual).toInclude(`color: (${P_NAME}) => ${P_NAME}.theme.colors.dark ?? "#aaa"`);
      });

      it('reconstructs default parameters in props (alternative syntax)', () => {
        const actual = transform(`
        styled.div({
          padding: ({ a, b } = { a: 100, b: 200 }) => \`\${a}px \${b}px\`,
        });
        `);

        expect(actual).toInclude(
          `padding: (__cmplp) => \`\${__cmplp.a ?? 100}px \${__cmplp.b ?? 200}px\``
        );
      });
    });
  });
});
