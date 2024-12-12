import type { Rule, Scope } from 'eslint';
import type { CallExpression, Expression, ObjectExpression, Property, Super } from 'estree';

import { getScope } from './context-compat';

type Reference = Scope.Reference;
type WhitelistedFunction = [packageName: string, functionName: string];

type Reporter = Rule.RuleContext['report'];

export const getCssMapObject = (node: CallExpression): ObjectExpression | undefined => {
  // We assume the argument `node` is already a cssMap() call.

  // Things like the number of arguments to cssMap and the type of
  // cssMap's argument are handled by the TypeScript compiler, so
  // we don't bother with creating eslint errors for these here

  if (node.arguments.length !== 1 || node.arguments[0].type !== 'ObjectExpression') {
    return;
  }

  return node.arguments[0];
};

const findNodeReference = (references: Reference[], node: Expression): Reference | undefined => {
  return references.find((reference) => reference.identifier === node);
};

const getAllowedFunctionCalls = (options: any[]): WhitelistedFunction[] => {
  if (options.length === 0 || options[0]?.allowedFunctionCalls === undefined) {
    return [];
  }

  // Beyond the basic check of "does allowedFunctionCalls exist?",
  // we assume ESLint's rule checker type checks the contents of allowedFunctionCalls
  // as it should
  return options[0].allowedFunctionCalls as WhitelistedFunction[];
};

export class CssMapObjectChecker {
  private readonly allowedFunctionCalls: WhitelistedFunction[];
  private readonly cssMapObject: ObjectExpression;

  private readonly report: Reporter;
  private readonly references: Reference[];

  constructor(cssMapObject: ObjectExpression, context: Rule.RuleContext) {
    this.allowedFunctionCalls = getAllowedFunctionCalls(context.options);
    this.cssMapObject = cssMapObject;

    this.report = context.report;
    this.references = getScope(context, cssMapObject).references;
  }

  private isNotWhitelistedFunction(callee: Expression | Super) {
    if (callee.type !== 'Identifier' || this.allowedFunctionCalls.length === 0) {
      return true;
    }

    const reference = findNodeReference(this.references, callee);
    const definitions = reference?.resolved?.defs;

    if (!definitions) return true;
    return definitions.some((definition) => {
      // We add some restrictions to keep this simple...
      // Forbid non-imported functions
      if (definition.type !== 'ImportBinding') return true;
      // Forbid default imports (e.g. `import React from 'react'`)
      if (definition.node.type !== 'ImportSpecifier') return true;

      const packageName = definition.parent.source.value;
      const importedFunctionName = definition.node.imported.name;

      return !this.allowedFunctionCalls.some(
        ([allowedPackageName, allowedFunctionName]) =>
          allowedPackageName === packageName && allowedFunctionName === importedFunctionName
      );
    });
  }

  private checkCssMapObjectValue(value: Property['value']): void {
    if (value.type === 'CallExpression' && this.isNotWhitelistedFunction(value.callee)) {
      // object value is a function call in the style
      // {
      //     key: functionCall(), ...
      // }
      this.report({
        node: value,
        messageId: 'noFunctionCalls',
      });
    } else if (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression') {
      // object value is a function call in the style
      // {
      //     key: (prop) => prop.color,       // ArrowFunctionExpression
      //     get danger() { return { ... } }, // FunctionExpression
      // }
      this.report({
        node: value,
        messageId: 'noInlineFunctions',
      });
    } else if (value.type === 'BinaryExpression' || value.type === 'LogicalExpression') {
      this.checkCssMapObjectValue(value.left);
      this.checkCssMapObjectValue(value.right);
    } else if (value.type === 'Identifier') {
      const reference = findNodeReference(this.references, value);

      // Get the variable's definition when initialised. Assume that the last definition
      // is the most recent one.
      //
      // Ideally we would try to get the variable's value at the point at which
      // cssMap() is run, but ESLint doesn't seem to give us an easy way to
      // do that...
      const definitions = reference?.resolved?.defs;
      if (!definitions || definitions.length === 0) {
        // Variable is not defined :thinking:
        return;
      }

      for (const definition of definitions) {
        if (definition.type === 'Variable' && definition.node.init) {
          return this.checkCssMapObjectValue(definition.node.init);
        }
      }
    } else if (value.type === 'ObjectExpression') {
      // Object inside another object
      this.checkCssMapObject(value);
    } else if (value.type === 'TemplateLiteral') {
      // object value is a template literal, something like
      //     `hello world`
      //     `hello ${functionCall()} world`
      //     `hello ${someVariable} world`
      // etc.
      //
      // where the expressions are the parts enclosed within the
      // ${ ... }
      for (const expression of value.expressions) {
        this.checkCssMapObjectValue(expression);
      }
    }
  }

  private checkCssMapObject(cssMapObject: ObjectExpression) {
    for (const property of cssMapObject.properties) {
      if (property.type === 'SpreadElement') {
        this.report({
          node: property,
          messageId: 'noSpreadElement',
        });
        continue;
      }

      this.checkCssMapObjectValue(property.value);
    }
  }

  run(): void {
    this.checkCssMapObject(this.cssMapObject);
  }
}
