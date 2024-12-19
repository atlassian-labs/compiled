import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { Rule, Scope, SourceCode } from 'eslint';
import type { Node } from 'estree';

/**
 * Note: This compatibility layer is only needed while versions of ESLint earlier than 8.40
 * are supported.  Once support for the older versions are dropped, this can (and should)
 * go away.
 */

type RuleContext = Rule.RuleContext;
type TSSourceCode = Readonly<TSESLint.SourceCode>;
type TSRuleContext = TSESLint.RuleContext<string, readonly unknown[]>;
type TSVariables = Readonly<TSESLint.Scope.Variable[]>;

/**
 * Given a rule context, return the SourceCode object in a backwards compatible way.
 * This maintains support for ESLint v7 and v8 < 8.40
 * @param context - The rule context object
 */
export const getFilename = (context: RuleContext | TSRuleContext): string => {
  return context.filename ?? context.getFilename();
};

const isTSRuleContext = (context: RuleContext | TSRuleContext): context is TSRuleContext => {
  const parserServices = getSourceCode(context).parserServices ?? context.parserServices;

  return 'tsNodeToESTreeNodeMap' in parserServices;
};

/**
 * Given a rule context and the tree node, return the declared variables in a backwards compatible way.
 * This maintains support for ESLint v7 and v8 < 8.40
 * @param context - The rule context object
 * @param node - Tree node
 */
export function getDeclaredVariables(context: RuleContext, node: Node): Scope.Variable[];
export function getDeclaredVariables(context: TSRuleContext, node: TSESTree.Node): TSVariables;
export function getDeclaredVariables(
  context: RuleContext | TSRuleContext,
  node: Node | TSESTree.Node
): Scope.Variable[] | TSVariables {
  if (isTSRuleContext(context)) {
    return (
      getSourceCode(context).getDeclaredVariables?.(node as TSESTree.Node) ??
      context.getDeclaredVariables(node as TSESTree.Node)
    );
  } else {
    return (
      getSourceCode(context).getDeclaredVariables?.(node as Node) ??
      context.getDeclaredVariables(node as Node)
    );
  }
}

/**
 * Given a rule context, return the SourceCode object in a backwards compatible way.
 * This maintains support for ESLint v7 and v8 < 8.40
 * @param context - The rule context object
 */
export const getSourceCode = <TContext extends RuleContext | TSRuleContext>(
  context: TContext
): TContext extends RuleContext ? SourceCode : TSSourceCode => {
  return (context.sourceCode ?? context.getSourceCode()) as TContext extends RuleContext
    ? SourceCode
    : TSSourceCode;
};

/**
 * Given a rule context and the tree node, return the scope object in a backwards compatible way.
 * This maintains support for ESLint v7 and v8 < 8.40
 * @param context - The rule context object
 * @param node - Tree node
 */
export function getScope(context: RuleContext, node: Node): Scope.Scope;
export function getScope(context: TSRuleContext, node: TSESTree.Node): TSESLint.Scope.Scope;
export function getScope(
  context: RuleContext | TSRuleContext,
  node: Node | TSESTree.Node
): Scope.Scope | TSESLint.Scope.Scope {
  if (isTSRuleContext(context)) {
    return getSourceCode(context).getScope?.(node as TSESTree.Node) ?? context.getScope();
  } else {
    return getSourceCode(context).getScope?.(node as Node) ?? context.getScope();
  }
}
