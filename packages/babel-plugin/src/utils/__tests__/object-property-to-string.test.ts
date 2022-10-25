import { parse } from '@babel/parser';
import type { NodePath } from '@babel/traverse';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

import type { Metadata } from '../../types';
import { evaluateExpression } from '../evaluate-expression';
import { objectPropertyToString } from '../object-property-to-string';

jest.mock('../evaluate-expression');

const evaluateExpressionMock = <jest.MockedFn<typeof evaluateExpression>>evaluateExpression;

type TraverseState = { result: string };

describe('objectPropertyToString', () => {
  const mockMeta = {
    state: {
      key: 'originalMock',
    },
  } as Metadata;

  const testSetupVisitor = {
    ObjectProperty(this: TraverseState, path: NodePath<t.ObjectProperty>) {
      this.result = objectPropertyToString(path.node, mockMeta);
      path.stop();
    },
  };

  const transform = (code: string) => {
    const ast = parse(code, { sourceType: 'module' });
    const state: TraverseState = { result: '' };

    traverse(ast, testSetupVisitor, undefined, state);

    return state.result;
  };

  afterEach(jest.resetAllMocks);

  describe('Identifier', () => {
    it('gets key value when property is not computed', () => {
      const key = 'name';
      const actual = transform(`const obj = { ${key}: "value"};`);

      expect(actual).toBe(key);
    });

    it('gets key value when property is computed', () => {
      const key = 'name';

      evaluateExpressionMock.mockReturnValue({
        value: t.stringLiteral(key),
        meta: mockMeta,
      });

      const actual = transform(`
        const field = '${key}';
        const obj = {
          [field]: "value"
        };
      `);

      expect(actual).toBe(key);
    });
  });

  describe('StringLiteral & NumericLiteral', () => {
    it('gets key value when property is string', () => {
      const key = 'name';
      const actual = transform(`const obj = { '${key}': "value"};`);

      expect(actual).toBe(key);
    });

    it('gets key value when property is number', () => {
      const key = 100;
      const actual = transform(`const obj = { ${key}: "value"};`);

      expect(actual).toBe(String(key));
    });
  });

  describe('TemplateLiteral', () => {
    it('combines quasis and expressions into key value', () => {
      const selectorId = '#id';
      const classSelector = '.hidden';

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.stringLiteral(selectorId),
        meta: mockMeta,
      });

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.stringLiteral(classSelector),
        meta: mockMeta,
      });

      const actual = transform(`
        const ID = '${selectorId}';
        const hideClass = '${classSelector}';

        const obj = {
          [\`\${ID}, \${hideClass}\`]: "value",
        };
      `);

      expect(actual).toBe(`${selectorId}, ${classSelector}`);
    });

    it('handles nested template literals while making sure metadata is correctly scoped', () => {
      const headerSelector = 'header';
      const headerComponentSelector = `[data-selector="${headerSelector}"]`;
      const itemSelector = 'item';
      const itemComponentSelector = `[data-selector="${itemSelector}"]`;

      const headerImportMeta = {
        state: {
          key: 'headerScope',
        },
      } as Metadata;

      const itemImportMeta = {
        state: {
          key: 'itemScope',
        },
      } as Metadata;

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.templateLiteral(
          [t.templateElement({ raw: '[data-selector="' }), t.templateElement({ raw: '"]' })],
          [t.identifier('HEADER')]
        ),
        meta: headerImportMeta,
      });

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.stringLiteral(headerSelector),
        meta: headerImportMeta,
      });

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.templateLiteral(
          [t.templateElement({ raw: '[data-selector="' }), t.templateElement({ raw: '"]' })],
          [t.identifier('ITEM')]
        ),
        meta: itemImportMeta,
      });

      evaluateExpressionMock.mockReturnValueOnce({
        value: t.stringLiteral(itemSelector),
        meta: itemImportMeta,
      });

      const actual = transform(`
        import { HEADER_SELECTOR } from './header';
        import { ITEM_SELECTOR } from './item';

        const obj = {
          [\`\${HEADER_SELECTOR}, \${ITEM_SELECTOR}\`]: "value",
        };
    `);

      // asserts correct metadata is used when using nested evaluations
      expect(evaluateExpressionMock).nthCalledWith(1, expect.anything(), mockMeta);
      expect(evaluateExpressionMock).nthCalledWith(2, expect.anything(), headerImportMeta);
      expect(evaluateExpressionMock).nthCalledWith(3, expect.anything(), mockMeta);
      expect(evaluateExpressionMock).nthCalledWith(4, expect.anything(), itemImportMeta);

      expect(actual).toBe(`${headerComponentSelector}, ${itemComponentSelector}`);
    });

    it('throws error when has TSType expression', () => {
      evaluateExpressionMock.mockReturnValue({
        value: t.stringLiteral('name'),
        meta: mockMeta,
      });

      expect(() => {
        transform('const obj = { [`key-${name: any}`]: "value"};');
      }).toThrow();
    });
  });

  describe('BinaryExpression', () => {
    it('concatenates expressions', () => {
      const s1 = 'field';
      const s2 = 'Name';
      const num = 1;
      const actual = transform(`const obj = { ['${s1}' + '${s2}' + ${num}]: "value"};`);

      expect(actual).toBe(`${s1}${s2}${num}`);
    });

    it('throws error when illegal string operator used', () => {
      expect(() => {
        transform('const obj = { ["illegal" * "op"]: "value"};');
      }).toThrow();
    });
  });

  describe('illegal expressions', () => {
    it('throws when unsupported expression used', () => {
      evaluateExpressionMock.mockReturnValue({
        value: t.arrayExpression([]),
        meta: mockMeta,
      });

      expect(() => {
        transform(`
          const array = [];
          const obj = { [array]: "value" };
        `);
      }).toThrow();
    });
  });
});
