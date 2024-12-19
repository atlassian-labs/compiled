import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { Rule, Scope, SourceCode } from 'eslint';
import type { Node } from 'estree';

import { getFilename, getDeclaredVariables, getSourceCode, getScope } from '../context-compat';

describe('context-compat', () => {
  const node = { obj: 'node' } as unknown as Node;
  const tsNode = { obj: 'tsNode' } as unknown as TSESTree.Node;
  const scope = { obj: 'scope' } as unknown as Scope.Scope;
  const parserServices = { obj: 'parserServices' };
  const variables = [{ name: 'var1' }];
  const sourceCode = {
    getDeclaredVariables: jest.fn().mockReturnValue(variables),
    getScope: jest.fn().mockReturnValue(scope),
    parserServices,
  } as unknown as SourceCode;
  const tsParserServices = {
    tsNodeToESTreeNodeMap: {},
  };

  describe('getFilename', () => {
    it('should prefer context.filename if defined', () => {
      const context = {
        filename: 'test-file.ts',
        getFilename: jest.fn().mockReturnValue('test-file-from-getFilename.ts'),
      } as unknown as Rule.RuleContext;

      const result = getFilename(context);

      expect(result).toBe('test-file.ts');
      expect(context.getFilename).not.toHaveBeenCalled();
    });

    it('should fall back to context.getFilename if context.filename is undefined (v7)', () => {
      const context = {
        getFilename: jest.fn().mockReturnValue('test-file-from-getFilename.ts'),
      } as unknown as Rule.RuleContext;

      const result = getFilename(context);

      expect(result).toBe('test-file-from-getFilename.ts');
      expect(context.getFilename).toHaveBeenCalled();
    });
  });

  describe('getSourceCode', () => {
    it('should prefer context.sourceCode if defined', () => {
      const context = {
        sourceCode,
        getSourceCode: jest.fn(),
      } as unknown as Rule.RuleContext;

      const result = getSourceCode(context);

      expect(result).toBe(sourceCode);
      expect(context.getSourceCode).not.toHaveBeenCalled();
    });

    it('should return context.getSourceCode() if context.sourceCode is undefined (v7)', () => {
      const context: Rule.RuleContext = {
        getSourceCode: jest.fn().mockReturnValue(sourceCode),
      } as unknown as Rule.RuleContext;

      const result = getSourceCode(context);

      expect(result).toBe(sourceCode);
      expect(context.getSourceCode).toHaveBeenCalled();
    });
  });

  describe('getDeclaredVariables', () => {
    describe('ESLint RuleContext', () => {
      it('should prefer sourceCode.getDeclaredVariables if context.sourceCode is defined', () => {
        const context = {
          sourceCode,
          getSourceCode: jest.fn(),
        } as unknown as Rule.RuleContext;

        const result = getDeclaredVariables(context, node);

        expect(result).toBe(variables);
        expect(context.sourceCode.getDeclaredVariables).toHaveBeenCalledWith(node);
        expect(context.getSourceCode).not.toHaveBeenCalled();
      });

      it('should use getSourceCode().getDeclaredVariables if context.sourceCode is undefined (v7)', () => {
        const context = {
          getSourceCode: jest.fn().mockReturnValue(sourceCode),
        } as unknown as Rule.RuleContext;

        const result = getDeclaredVariables(context, node);

        expect(result).toBe(variables);
        expect(sourceCode.getDeclaredVariables).toHaveBeenCalledWith(node);
        expect(context.getSourceCode).toHaveBeenCalled();
      });
    });

    describe('TS ESLint RuleContext', () => {
      it('should prefer sourceCode.getDeclaredVariables if context.sourceCode is defined', () => {
        const context = {
          sourceCode: {
            ...sourceCode,
            parserServices: tsParserServices,
          },
          getSourceCode: jest.fn(),
        } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;

        const result = getDeclaredVariables(context, tsNode);

        expect(result).toBe(variables);
        expect(context.sourceCode.getDeclaredVariables).toHaveBeenCalledWith(tsNode);
        expect(context.getSourceCode).not.toHaveBeenCalled();
      });

      it('should use getSourceCode().getDeclaredVariables if context.sourceCode is undefined (v7)', () => {
        const tsSourceCode = {
          ...sourceCode,
          parserServices: tsParserServices,
        };
        const context = {
          getSourceCode: jest.fn().mockReturnValue(tsSourceCode),
        } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;

        const result = getDeclaredVariables(context, tsNode);

        expect(result).toBe(variables);
        expect(sourceCode.getDeclaredVariables).toHaveBeenCalledWith(tsNode);
        expect(context.getSourceCode).toHaveBeenCalled();
      });
    });
  });

  describe('getScope', () => {
    describe('ESLint RuleContext', () => {
      it('should prefer sourceCode.getScope when context.soureCode is available', () => {
        const context = {
          sourceCode,
          getScope: jest.fn(),
        } as unknown as Rule.RuleContext;

        const result = getScope(context, node);

        expect(result).toBe(scope);
        expect(context.sourceCode.getScope).toHaveBeenCalledWith(node);
        expect(context.getScope).not.toHaveBeenCalled();
      });

      it('should use context.getScope when context.sourceCode is undefined (v7)', () => {
        const { getScope: mockGetScope, ...sourceCodeWithoutGetScope } = sourceCode;
        const context = {
          getScope: jest.fn().mockReturnValue(scope),
          getSourceCode: jest.fn().mockReturnValue(sourceCodeWithoutGetScope),
        } as unknown as Rule.RuleContext;

        const result = getScope(context, node);

        expect(result).toBe(scope);
        expect(context.getScope).toHaveBeenCalled();
      });
    });

    describe('TS ESLint RuleContext', () => {
      it('should prefer sourceCode.getScope when context.soureCode is available', () => {
        const tsSourceCode = {
          ...sourceCode,
          parserServices: tsParserServices,
        };
        const context = {
          sourceCode: tsSourceCode,
          getScope: jest.fn(),
        } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;

        const result = getScope(context, tsNode);

        expect(result).toBe(scope);
        expect(context.sourceCode.getScope).toHaveBeenCalledWith(tsNode);
        expect(context.getScope).not.toHaveBeenCalled();
      });

      it('should use context.getScope when context.sourceCode is undefined (v7)', () => {
        const tsSourceCode = {
          parserServices: tsParserServices,
        };
        const context = {
          getScope: jest.fn().mockReturnValue(scope),
          getSourceCode: jest.fn().mockReturnValue(tsSourceCode),
        } as unknown as TSESLint.RuleContext<string, readonly unknown[]>;

        const result = getScope(context, tsNode);

        expect(result).toBe(scope);
        expect(context.getScope).toHaveBeenCalled();
      });
    });
  });
});
