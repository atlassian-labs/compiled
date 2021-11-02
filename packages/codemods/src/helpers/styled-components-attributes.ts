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
  ExportNamedDeclaration,
} from 'jscodeshift';
import { kebabCase } from '@compiled/utils';

import type { CodemodPluginInstance } from '../plugins/types';

const isStyleProperty = (property: any) =>
  property.type === 'ObjectProperty' &&
  property.key.type === 'Identifier' &&
  property.key.name === 'style';

const getStyleAttributeExpression = ({ expression }: { expression: ObjectExpression }) =>
  expression.type === 'ObjectExpression'
    ? (expression.properties.find((property) => isStyleProperty(property)) as ObjectProperty)
    : null;

const getRestAttributeExpressions = ({ expression }: { expression: ObjectExpression }) =>
  expression.type === 'ObjectExpression'
    ? (expression.properties.filter((property) => !isStyleProperty(property)) as ObjectProperty[])
    : null;

const getAlternativeComponentName = (name: string) => `Compiled${name}`;

const stringifyPropertyExpression = ({
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
      const propName = ((prop as ObjectProperty).value as Identifier).name;

      if (value.type === 'Identifier') {
        return propName === value.name;
      }

      return j(value).find(j.Identifier, (identifier) => propName === identifier.name);
    });

    usedProps = j(j.objectPattern(destructedProps)) as Collection<ObjectPattern>;
  } else {
    usedProps = j(value).find(j.Identifier, (identifier) => propsParam.name === identifier.name);
  }

  if (!usedProps.length) {
    return value;
  }

  return j.arrowFunctionExpression(usedProps.nodes(), value);
};

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
          const expression = stringifyPropertyExpression({
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

const createComponentWrapper = ({
  j,
  expression,
  attrs,
  name,
}: {
  j: JSCodeshift;
  expression: ArrowFunctionExpression | ObjectExpression;
  attrs: ObjectProperty[];
  name: string;
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

  const component = j.jsxElement(
    j.jsxOpeningElement(j.jsxIdentifier(getAlternativeComponentName(name)), jsxAttrs, true)
  );

  return j.variableDeclaration('const', [
    j.variableDeclarator(j.identifier(name), j.arrowFunctionExpression([propsParam], component)),
  ]);
};

const createCompiledComponent = ({
  j,
  expression,
  name,
}: {
  j: JSCodeshift;
  expression: TaggedTemplateExpression;
  name: string;
}) => j.variableDeclaration('const', [j.variableDeclarator(j.identifier(name), expression)]);

const applyBuildAttributes = ({
  plugins,
  originalNode,
  transformedNode,
  extraContent,
}: {
  plugins: Array<CodemodPluginInstance>;
  originalNode: VariableDeclaration;
  transformedNode: VariableDeclaration;
  extraContent: VariableDeclaration | null;
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
      extraContent,
    });
  }, originalNode as VariableDeclaration | ExportNamedDeclaration);
};

export const convertStyledAttrsToComponent = ({
  j,
  plugins,
  templateExpressions,
}: {
  j: JSCodeshift;
  plugins: CodemodPluginInstance[];
  templateExpressions: Collection<TaggedTemplateExpression>;
}): void => {
  templateExpressions.forEach((templateExpression) => {
    let newComponentDeclaration = null;
    let extraContent = null;

    const componentDeclarator = templateExpression.parentPath;
    const componentDeclaration = componentDeclarator.parentPath.parentPath;
    const componentName = componentDeclarator.value.id.name;
    const expressionTag = templateExpression.value.tag as CallExpression;
    const expression = expressionTag.callee as MemberExpression;
    const styledTagName = ((expression.object as MemberExpression).property as Identifier).name;

    // construct new template expression without attrs property
    const newTemplateExpressions = j.taggedTemplateExpression(
      j.memberExpression(j.identifier('styled'), j.identifier(styledTagName)),
      templateExpression.value.quasi
    );

    const attrsArgumentExpression = expressionTag.arguments[0] as
      | ObjectExpression
      | ArrowFunctionExpression;
    const attrResultExpression = (
      attrsArgumentExpression.type === 'ArrowFunctionExpression' &&
      attrsArgumentExpression.body.type === 'ObjectExpression'
        ? attrsArgumentExpression.body
        : attrsArgumentExpression
    ) as ObjectExpression;

    const styleAttributeExpression = getStyleAttributeExpression({
      expression: attrResultExpression,
    });
    const restAttributes = getRestAttributeExpressions({ expression: attrResultExpression });

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

    if (restAttributes && restAttributes.length > 0) {
      extraContent = createCompiledComponent({
        j,
        expression: newTemplateExpressions,
        name: getAlternativeComponentName(componentName),
      });
      newComponentDeclaration = createComponentWrapper({
        j,
        expression: attrsArgumentExpression,
        attrs: restAttributes,
        name: componentName,
      });
    } else {
      newComponentDeclaration = j.variableDeclaration('const', [
        j.variableDeclarator(j.identifier(componentName), newTemplateExpressions),
      ]);
    }

    // sanity check that we actually have a new node to replace with
    newComponentDeclaration &&
      applyBuildAttributes({
        plugins,
        originalNode: componentDeclaration,
        transformedNode: newComponentDeclaration,
        extraContent,
      });
  });
};
