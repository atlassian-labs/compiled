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

export const getIdentifierText = (
  node: ts.PropertyName | ts.BindingName | ts.Expression
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
    prop => ts.isJsxAttribute(prop) && prop.name.escapedText === propertyName
  ) as ts.JsxAttribute | undefined;

  return attribute?.initializer ? attribute.initializer : undefined;
};

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
      specifier => specifier.name.escapedText === namedImport
    ).length > 0;

  return isStyledImported;
};
