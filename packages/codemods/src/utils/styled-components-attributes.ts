import { kebabCase } from '@compiled/utils';
import type {
  JSCodeshift,
  Collection,
  TaggedTemplateExpression,
  CallExpression,
  ArrowFunctionExpression,
  MemberExpression,
  Identifier,
  ObjectExpression,
  TemplateElement,
  ObjectPattern,
  ObjectProperty,
  JSXAttribute,
  JSXSpreadAttribute,
  VariableDeclaration,
  ASTNode,
  ASTPath,
} from 'jscodeshift';

import type { CodemodPluginInstance } from '../plugins/types';

type StyledAttributesDeclarationNode = ASTPath<VariableDeclaration | TaggedTemplateExpression>;

const isStyleProperty = (property: ASTNode) =>
  property.type === 'ObjectProperty' &&
  property.key.type === 'Identifier' &&
  property.key.name === 'style';

const getStyleAttributeExpression = (expression: ObjectExpression) =>
  expression.type === 'ObjectExpression'
    ? (expression.properties.find((property) => isStyleProperty(property)) as ObjectProperty)
    : null;

const getRestAttributeExpressions = (expression: ObjectExpression) =>
  expression.type === 'ObjectExpression'
    ? (expression.properties.filter((property) => !isStyleProperty(property)) as ObjectProperty[])
    : null;

const getAlternativeComponentName = (name: string) => `${name}Styles`;

/**
 * Extracts used arguments for property value calculation and returns arrow function expression that will be used as a tagged template expression.
 * @returns ArrowFunctionExpression
 */
const convertObjectPropertyToExpression = ({
  j,
  params,
  value,
}: {
  j: JSCodeshift;
  params: (Identifier | ObjectPattern)[];
  value: MemberExpression | Identifier;
}) => {
  let usedProps;
  const propsParam = params[0];

  if (propsParam.type === 'ObjectPattern') {
    const destructedProps = propsParam.properties.filter((prop) => {
      let propName: string;

      if (prop.type === 'ObjectProperty' && prop.value.type === 'Identifier') {
        propName = prop.value.name;
      } else {
        throw new Error('Property type is not supported');
      }

      if (value.type === 'Identifier') {
        return propName === value.name;
      }

      return j(value).find(j.Identifier, (identifier) => propName === identifier.name).length > 0;
    });

    usedProps = j(j.objectPattern(destructedProps));
  } else {
    usedProps = j(value)
      .find(j.Identifier, (identifier) => propsParam.name === identifier.name)
      .at(-1);
  }

  if (!usedProps.length) {
    return value;
  }

  return j.arrowFunctionExpression(usedProps.nodes(), value);
};

/**
 * Extracts data from tagged template
 * @returns data.quasis - array of quasis for tagged templates. e.g. [`left: `, `;\ntop: `, ';\n']
 * @returns data.expression - array of expression will be used in tagged template
 */
const extractTemplateData = ({
  j,
  styleFn,
}: {
  j: JSCodeshift;
  styleFn: ArrowFunctionExpression;
}) => {
  const body = styleFn.body;

  if (body.type === 'ObjectExpression') {
    const styleFnParams = styleFn.params;
    const properties = (styleFn.body as ObjectExpression).properties;

    const { keys, expressions } = properties.reduce(
      (acc, property) => {
        if (property.type === 'ObjectProperty') {
          const key = kebabCase((property.key as Identifier).name);
          const expression = convertObjectPropertyToExpression({
            j,
            params: styleFnParams as Identifier[],
            value: property.value as MemberExpression,
          });

          acc.keys.push(key);
          acc.expressions.push(expression);
        }
        return acc;
      },
      { keys: [], expressions: [] } as {
        keys: string[];
        expressions: (Identifier | ArrowFunctionExpression | MemberExpression)[];
      }
    );

    const quasis = keys.reduce((quasis, key, i) => {
      const prefix = i === 0 ? '' : ';';
      const isLast = i === keys.length - 1;
      const element = `${prefix}\n${key}: `;

      quasis.push(j.templateElement({ cooked: element, raw: element }, false));
      isLast && quasis.push(j.templateElement({ cooked: ';', raw: ';' }, false));

      return quasis;
    }, [] as TemplateElement[]);

    return { quasis, expressions };
  }

  return { quasis: [], expressions: [] };
};

/**
 * @returns ArrowFunctionExpression for anonymous or VariableDeclaration with spreaded props and attributes
 */
const createWrapperNode = ({
  j,
  expression,
  attrs,
  name,
  isAnonymous,
}: {
  j: JSCodeshift;
  expression: ArrowFunctionExpression | ObjectExpression;
  attrs: ObjectProperty[];
  name: string;
  isAnonymous?: boolean;
}) => {
  const propsParam =
    expression.type === 'ArrowFunctionExpression' && expression.params[0].type === 'Identifier'
      ? expression.params[0]
      : j.identifier('props');
  const jsxAttrs: (JSXAttribute | JSXSpreadAttribute)[] = attrs.map((attr) =>
    j.jsxAttribute(
      j.jsxIdentifier((attr.key as Identifier).name),
      j.jsxExpressionContainer(attr.value as Parameters<typeof j.jsxExpressionContainer>[0])
    )
  );

  jsxAttrs.push(j.jsxSpreadAttribute(propsParam));

  const wrapperExpression = j.arrowFunctionExpression(
    [propsParam],
    j.jsxElement(
      j.jsxOpeningElement(j.jsxIdentifier(getAlternativeComponentName(name)), jsxAttrs, true)
    )
  );

  return isAnonymous
    ? wrapperExpression
    : j.variableDeclaration('const', [j.variableDeclarator(j.identifier(name), wrapperExpression)]);
};

const createComposedNode = ({
  j,
  expression,
  name,
}: {
  j: JSCodeshift;
  expression: TaggedTemplateExpression;
  name: string;
}) => j.variableDeclaration('const', [j.variableDeclarator(j.identifier(name), expression)]);

/**
 * Returns declaration data
 * @returns data.name - component name if it's a variable declaration or generic component name
 * @returns data.isAnonymous - flag for an anonymous declarations
 * @returns data.declaration - declaration node
 */
const getDeclarationData = (expression: ASTPath) => {
  const parentDeclaration = expression.parentPath;

  if (
    parentDeclaration.value.type === 'VariableDeclarator' &&
    parentDeclaration.value.id.type === 'Identifier'
  ) {
    return {
      name: parentDeclaration.value.id.name as string,
      declaration: findParent(expression, 'VariableDeclaration') as StyledAttributesDeclarationNode,
    };
  }

  return {
    name: `ComposedComponent`,
    declaration: expression as StyledAttributesDeclarationNode,
    isAnonymous: true,
  };
};

/**
 * @returns attributes expression whatever it's `styled.div.attrs(props => expression)` or `styled.div.attrs(expression)`
 */
const getAttributesExpression = (expression: ASTPath<TaggedTemplateExpression>) => {
  const expressionCall = expression.value.tag as CallExpression;
  const attrsArgumentExpression = expressionCall.arguments[0] as
    | ObjectExpression
    | ArrowFunctionExpression;
  return (
    attrsArgumentExpression.type === 'ArrowFunctionExpression' &&
    attrsArgumentExpression.body.type === 'ObjectExpression'
      ? attrsArgumentExpression.body
      : attrsArgumentExpression
  ) as ObjectExpression;
};

/**
 * Converts `styled.div.attrs` expression to `styled.div`
 * @returns TaggedTemplateExpression - new tagged template expression
 */
const createNewTemplateExpression = ({
  j,
  expression,
  compiledLocalStyledName,
}: {
  j: JSCodeshift;
  expression: ASTPath<TaggedTemplateExpression>;
  compiledLocalStyledName: string;
}) => {
  const expressionCall = expression.value.tag as CallExpression;
  const styledTagName = (
    ((expressionCall.callee as MemberExpression).object as MemberExpression).property as Identifier
  ).name;

  return j.taggedTemplateExpression(
    j.memberExpression(j.identifier(compiledLocalStyledName), j.identifier(styledTagName)),
    expression.value.quasi
  );
};

const applyBuildAttributes = ({
  plugins,
  originalNode,
  transformedNode,
  composedNode,
}: {
  plugins: CodemodPluginInstance[];
  originalNode: StyledAttributesDeclarationNode;
  transformedNode: VariableDeclaration | TaggedTemplateExpression | ArrowFunctionExpression;
  composedNode: VariableDeclaration | null;
}) => {
  plugins.reduce((currentNode, plugin) => {
    const buildAttributesImpl = plugin.transform?.buildAttributes;
    if (!buildAttributesImpl) {
      return currentNode;
    }

    return buildAttributesImpl({
      originalNode,
      transformedNode,
      currentNode,
      composedNode,
    });
  }, originalNode as StyledAttributesDeclarationNode);
};

const findParent = (node: ASTPath, parentType: string) => {
  let parent = node;

  while (parent.parentPath && parent.value.type !== parentType) {
    parent = parent.parentPath;
  }

  return parent;
};

export const convertStyledAttrsToComponent = ({
  j,
  plugins,
  expressions,
  compiledLocalStyledName,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
  expressions: Collection<TaggedTemplateExpression>;
  compiledLocalStyledName: string;
}): void => {
  expressions.forEach((expression) => {
    let transformedNode = null;
    let composedNode = null;

    const attributesExpression = getAttributesExpression(expression);
    const styleAttributeExpression = getStyleAttributeExpression(attributesExpression);
    const newTemplateExpressions = createNewTemplateExpression({
      j,
      expression,
      compiledLocalStyledName,
    });

    if (styleAttributeExpression) {
      // extract new template data from arrow function
      const newTemplateData = extractTemplateData({
        j,
        styleFn: styleAttributeExpression.value as ArrowFunctionExpression,
      });

      // insert data into the new expression
      if (newTemplateData != undefined) {
        const { quasis, expressions } = newTemplateData;

        newTemplateExpressions.quasi.expressions.unshift(...expressions);
        newTemplateExpressions.quasi.quasis.unshift(...quasis);
      }
    }

    const {
      isAnonymous,
      name: componentName,
      declaration: expressionDeclarator,
    } = getDeclarationData(expression);

    const restAttributes = getRestAttributeExpressions(attributesExpression);

    if (restAttributes && restAttributes.length > 0) {
      composedNode = createComposedNode({
        j,
        expression: newTemplateExpressions,
        name: getAlternativeComponentName(componentName),
      });
      transformedNode = createWrapperNode({
        j,
        expression: attributesExpression,
        attrs: restAttributes,
        name: componentName,
        isAnonymous,
      });
    } else {
      transformedNode = isAnonymous
        ? newTemplateExpressions
        : j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(componentName), newTemplateExpressions),
          ]);
    }

    // sanity check that we actually have a new node to replace with
    transformedNode &&
      applyBuildAttributes({
        plugins,
        originalNode: expressionDeclarator,
        transformedNode,
        composedNode,
      });
  });
};
