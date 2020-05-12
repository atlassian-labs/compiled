import * as ts from 'typescript';

export const createNodeError = (message: string, node: ts.Node) => {
  throw new Error(`@compiled/css-in-js => ${message}

${node.getText()}
`);
};

export const getExpressionText = (node: ts.Expression) => {
  if (!ts.isStringLiteral(node)) {
    throw createNodeError('expression isnt a string literal', node);
  }

  return (node as ts.StringLiteral).text;
};

export const getPropertyAccessExpressionIdentifiers = (
  node: ts.PropertyAccessExpression
): string[] => {
  const identifiers = [node.name.text];
  let nextExpression: ts.Node = node.expression;

  while (ts.isPropertyAccessExpression(nextExpression)) {
    identifiers.push(nextExpression.name.text);
    nextExpression = nextExpression.expression;
  }

  return identifiers.reverse();
};

export const getIdentifierText = (
  node: ts.PropertyName | ts.BindingName | ts.Expression | ts.Identifier
): string => {
  return ((node as ts.Identifier).escapedText as string) || (node as ts.Identifier).text;
};

export const getAssignmentIdentifier = (
  node: ts.ShorthandPropertyAssignment | ts.PropertyAssignment
): ts.Identifier => {
  return 'initializer' in node ? node.initializer : (node.name as any);
};

export const getAssignmentIdentifierText = (
  node: ts.ShorthandPropertyAssignment | ts.PropertyAssignment
) => {
  return getIdentifierText(getAssignmentIdentifier(node));
};

export const getJsxNodeAttributes = (
  node: ts.JsxElement | ts.JsxSelfClosingElement
): ts.JsxAttributes => {
  if ('attributes' in node) {
    return node.attributes;
  }

  return node.openingElement.attributes;
};

export const getJsxNodeAttributesValue = (
  node: ts.JsxElement | ts.JsxSelfClosingElement,
  propertyName: string
) => {
  const attribute = getJsxNodeAttributes(node).properties.find(
    (prop) => ts.isJsxAttribute(prop) && prop.name.escapedText === propertyName
  ) as ts.JsxAttribute | undefined;

  return attribute?.initializer ? attribute.initializer : undefined;
};

export const isConst = (node: ts.Node) => node.parent && node.parent.flags & ts.NodeFlags.Const;

export const isPackageModuleImport = (statement: ts.Node, namedImport?: string): boolean => {
  if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
    return false;
  }

  const isLibraryImport = statement.moduleSpecifier.text.startsWith('@compiled/css-in-js');
  if (!isLibraryImport) {
    return false;
  }

  if (namedImport === undefined) {
    return true;
  }

  if (
    !statement.importClause?.namedBindings ||
    !ts.isNamedImports(statement.importClause?.namedBindings)
  ) {
    return false;
  }

  const isStyledImported =
    statement.importClause.namedBindings.elements.filter(
      (specifier) => specifier.name.escapedText === namedImport
    ).length > 0;

  return isStyledImported;
};

export const createJsxOpeningElement = (
  node: ts.Node,
  tagName: ts.JsxTagNameExpression,
  typeArguments: readonly ts.TypeNode[] | undefined,
  attributes: ts.JsxAttributes
) => {
  return ts.setOriginalNode(ts.createJsxOpeningElement(tagName, typeArguments, attributes), node);
};

export const createJsxClosingElement = (node: ts.Node, tagName: ts.JsxTagNameExpression) => {
  return ts.setOriginalNode(ts.createJsxClosingElement(tagName), node);
};
