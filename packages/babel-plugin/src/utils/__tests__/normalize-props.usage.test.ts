import { parse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { Node } from '@babel/types';
import { format } from 'prettier';

import { PROPS_IDENTIFIER_NAME } from '../../constants';
import { normalizePropsUsage } from '../normalize-props-usage';

describe('normalizePropsUsage', () => {
  const transform = (code: string) => {
    const ast = parse(code);
    let result: NodePath<Node> | undefined;

    traverse(ast, {
      CallExpression(path) {
        normalizePropsUsage(path);
        result = path;
        path.stop();
      },
      TaggedTemplateExpression(path) {
        normalizePropsUsage(path);
        result = path;
        path.stop();
      },
    });

    return format(result?.toString() || '', { parser: 'babel-ts' })
      .replace(/\n/g, '')
      .replace(/\s+/g, ' ');
  };

  const { a } = b;

  it(`renames props param to ${PROPS_IDENTIFIER_NAME}`, () => {
    const actual = transform(`
        styled.div({
            color: (p) => p.color,
        });
    `);

    expect(actual).toInclude('(props) => props.color');
  });

  describe('destructured props', () => {
    it('reconstructs destructured props param', () => {
      const actual = transform(`
        styled.div(({ width }) => width && { width });
    `);

      expect(actual).toInclude('(props) => props.width && { width: props.width, }');
    });

    it('reconstructs nested destructured props param', () => {
      const actual = transform(`
        styled.div\`
            color: \${({ theme: { colors: { dark } } }) => dark ? dark.red : 'black'};
        \`;
    `);

      expect(actual).toInclude(
        '(props) => props.theme.colors.dark ? props.theme.colors.dark.red : "black"'
      );
    });
  });
});
