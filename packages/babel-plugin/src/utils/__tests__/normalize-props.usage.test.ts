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
  });
});
