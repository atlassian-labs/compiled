import generate from '@babel/generator';
import { parse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import type { Identifier, MemberExpression } from '@babel/types';

import type { Metadata } from '../../types';
import { buildCss } from '../css-builders';

describe('buildCss', () => {
  it('returns a css string and variables array for an identifier node', () => {
    const file = parse(`
      const color = { background: 'red' };
      const styles = color;

      run(styles);
    `);

    let path: NodePath<Identifier> | null = null;
    traverse(file, {
      CallExpression(nodePath) {
        nodePath.traverse({
          Identifier(innerPath) {
            if (innerPath.node.name === 'styles') {
              path = innerPath;
            }
          },
        });
      },
    });

    expect(path).not.toEqual(null);
    const meta: Metadata = {
      parentPath: path!.parentPath,
      state: {
        filename: '',
      },
    } as any;

    const { css, variables } = buildCss(path!.node, meta);
    expect(css).toEqual([{ css: 'background: red;', type: 'unconditional' }]);
    expect(variables).toEqual([]);
  });

  it('returns a css string and variables array for a member expression node', () => {
    const file = parse(`
      const styles = { option1: { background: 'red' } };

      run(styles.option1);
    `);

    let path: NodePath<MemberExpression> | null = null;
    traverse(file, {
      CallExpression(nodePath) {
        nodePath.traverse({
          MemberExpression(innerPath) {
            path = innerPath;
          },
        });
      },
    });

    expect(path).not.toEqual(null);

    const meta: Metadata = {
      parentPath: path!.parentPath,
      state: {
        cssMap: {},
        filename: '',
      },
    } as any;

    const { css, variables } = buildCss(path!.node, meta);
    expect(css).toEqual([{ css: 'background: red;', type: 'unconditional' }]);
    expect(variables).toEqual([]);
  });

  it('returns a css string for a variable member expression', () => {
    const file = parse(
      `
      import { css } from '@compiled/react';

      const styles = { option1: css({ background: 'red' }) };

      run(styles[key]);
    `,
      { sourceType: 'module' }
    );

    let path: NodePath<MemberExpression> | null = null;
    traverse(file, {
      CallExpression(nodePath) {
        nodePath.traverse({
          MemberExpression(innerPath) {
            path = innerPath;
          },
        });
      },
    });

    expect(path).not.toEqual(null);

    const meta: Metadata = {
      parentPath: path!.parentPath,
      state: {
        cssMap: {},
        filename: '',
      },
    } as any;

    const { css, variables } = buildCss(path!.node, meta);
    // TODO: This should not happen
    expect(css).toEqual([{ css: 'option1: var(--_g48cyt);', type: 'unconditional' }]);
    expect(variables.length).toEqual(1);
    expect(variables[0].name).toEqual('--_g48cyt');
    expect(generate(variables[0].expression).code).toMatchInlineSnapshot(`
      "css({
        background: 'red'
      })"
    `);
  });
});
