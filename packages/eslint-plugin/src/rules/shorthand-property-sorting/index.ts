import {
  shorthandBuckets,
  shorthandFor,
  kebabCase,
  type ShorthandProperties,
} from '@compiled/utils';
import type { Rule } from 'eslint';
import estraverse from 'estraverse';
import type {
  ArrayExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  LogicalExpression,
  ObjectExpression,
} from 'estree';

import { isCss, isCssMap, isCxFunction, isStyled } from '../../utils';

type NodeParentExtension = {
  parent: Rule.Node;
};

type PropertyArray = (string | PropertyArray)[];
type PropertiesValid = {
  isValid: boolean;
  invalidProperties: string[];
};

const getVariableDefinition = (
  context: Rule.RuleContext,
  identifier: Identifier
): CallExpression | null => {
  const { references } = context.sourceCode.getScope(identifier);

  const functionCall = references.find(
    (reference) => reference.identifier === identifier
  )?.resolved;

  if (
    functionCall &&
    functionCall.defs.length &&
    functionCall.defs[0].node.type === 'VariableDeclarator' &&
    functionCall.defs[0].node.init.type === 'CallExpression'
  ) {
    return functionCall.defs[0].node.init as CallExpression;
  }

  return null;
};

const getObjectCSSProperties = (
  context: Rule.RuleContext,
  obj: ObjectExpression
): PropertyArray => {
  const properties: PropertyArray = [];
  for (const prop of obj.properties) {
    if (prop.type === 'SpreadElement') {
      properties.push(...parseCssArrayElement(context, prop.argument));
    } else if (prop.value.type === 'ObjectExpression') {
      // Property is DEFINITELY a selector.
      properties.push(getObjectCSSProperties(context, prop.value));
    } else if (prop.key.type === 'Identifier') {
      properties.push(prop.key.name);
    } else {
      // Property key is dynamic -- it may be a weird selector?
      // We can't parse this either way.
      continue;
    }
  }

  return properties;
};

const parseCssArrayElement = (
  context: Rule.RuleContext,
  element: ArrayExpression['elements'][number]
): PropertyArray => {
  let functionCall;

  if (!element) {
    return [];
  }

  const { references } = context.sourceCode.getScope(element);

  if (element.type === 'Identifier') {
    functionCall = getVariableDefinition(context, element);
  } else if (element.type === 'LogicalExpression') {
    return parseCssArrayElement(context, element.right);
  } else if (element.type === 'ConditionalExpression') {
    // Covers the case:
    //     someCondition ? someStyles : someOtherStyles
    return [
      ...parseCssArrayElement(context, element.consequent),
      ...parseCssArrayElement(context, element.alternate),
    ];
  } else if (element.type === 'MemberExpression' && element.object.type === 'Identifier') {
    // Covers cssMap usages
    functionCall = getVariableDefinition(context, element.object);
    if (!functionCall) {
      return [];
    }
    if (element.property.type !== 'Identifier' && element.property.type !== 'Literal') {
      return [];
    }

    return parseCssMap(context, functionCall);
  } else if (element.type === 'CallExpression' && isCss(element.callee as Rule.Node, references)) {
    functionCall = element;
  } else {
    // Feel free to extend this to cover more cases if needed
    // e.g. spread elements like <div css={ ...styles } />
    return [];
  }

  if (!functionCall) {
    return [];
  }

  return parseCss(context, functionCall);
};

const arePropertiesValid = (properties: PropertyArray): PropertiesValid => {
  let isValid = true;
  const invalidProperties: string[] = [];
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];

    if (Array.isArray(property)) {
      const { isValid: nestedIsValid, invalidProperties: nestedInvalidProperties } =
        arePropertiesValid(property);
      isValid = isValid && nestedIsValid;
      invalidProperties.push(...nestedInvalidProperties);
    } else {
      const propertyA = kebabCase(property) as ShorthandProperties;
      const depthA = shorthandBuckets[propertyA] ?? Infinity;

      for (let j = i + 1; j < properties.length; j++) {
        const propertiesJ = properties[j];

        if (properties[i] === properties[j]) {
          continue;
        }

        if (Array.isArray(propertiesJ)) {
          continue;
        }
        const propertyB = kebabCase(propertiesJ) as ShorthandProperties;
        const depthB = shorthandBuckets[propertyB] ?? Infinity;

        const longhandsForPropA: string[] = [
          propertyA,
          ...(Array.isArray(shorthandFor[propertyA]) ? (shorthandFor[propertyA] as string[]) : []),
        ];
        const longhandsForPropB: string[] = [
          propertyB,
          ...(Array.isArray(shorthandFor[propertyB]) ? (shorthandFor[propertyB] as string[]) : []),
        ];
        // TODO: test `all`

        if (Array.isArray(longhandsForPropA) && Array.isArray(longhandsForPropB)) {
          // find intersection between objects
          const intersectionAB = longhandsForPropA.filter((x) => longhandsForPropB.includes(x));

          if (intersectionAB.length > 0 && depthA >= depthB) {
            isValid = false;
            invalidProperties.push(propertyA, propertyB);
            break;
          }
        }
      }
    }
  }

  return { isValid, invalidProperties };
};

const parseCss = (context: Rule.RuleContext, node: CallExpression): PropertyArray => {
  const { references } = context.sourceCode.getScope(node);
  if (!isCss(node.callee as Rule.Node, references)) {
    return [];
  }

  if (node.arguments.length !== 1) {
    return [];
  }

  const objectExpression = node.arguments[0];
  if (objectExpression.type !== 'ObjectExpression') {
    return [];
  }

  return getObjectCSSProperties(context, objectExpression);
};

const parseCssMap = (context: Rule.RuleContext, node: CallExpression): PropertyArray => {
  const properties: PropertyArray = [];
  const { references } = context.sourceCode.getScope(node);
  if (!isCssMap(node.callee as Rule.Node, references)) {
    return [];
  }

  const objectExpression = node.arguments[0];
  if (objectExpression.type !== 'ObjectExpression') {
    return [];
  }

  for (const property of objectExpression.properties) {
    if (property.type === 'SpreadElement') {
      continue;
    }

    if (property.value.type !== 'ObjectExpression') {
      continue;
    }

    if (property.key.type !== 'Literal' && property.key.type !== 'Identifier') {
      continue;
    }

    // Unconditionally traverse through the whole cssMap object, for simplicity.
    //
    // Not very performant and can give false positives, but considering that
    // the cssMap key can be dynamic, we at least avoid any false negatives.
    //
    // (https://compiledcssinjs.com/docs/api-cssmap#dynamic-declarations)
    properties.push(...getObjectCSSProperties(context, property.value));
  }

  return properties;
};

const parseStyled = (context: Rule.RuleContext, node: CallExpression): PropertyArray => {
  // Handle styled
  const { references } = context.sourceCode.getScope(node);
  if (!isStyled(node.callee as Rule.Node, references)) {
    return [];
  }

  const properties: PropertyArray = [];

  if (node.callee.type === 'CallExpression' && node.callee.arguments.length) {
    // This is the BaseComponent in styled(BaseComponent)({ ... })
    const baseComponentName = node.callee.arguments[0];
    if (baseComponentName.type === 'Identifier') {
      // Assume that the styled function call and the definition of BaseComponent
      // are both defined in the same scope, presumably global scope.
      //
      // (Not sure how many people don't use it this way)
      const baseComponentDefinition = references.find(
        (ref) => ref.identifier === baseComponentName
      )?.resolved;

      if (
        baseComponentDefinition &&
        baseComponentDefinition.defs.length &&
        baseComponentDefinition.defs[0].node.type === 'VariableDeclarator' &&
        baseComponentDefinition.defs[0].node.init.type === 'CallExpression'
      ) {
        const baseComponent = baseComponentDefinition.defs[0].node.init as CallExpression;
        properties.push(...parseStyled(context, baseComponent));
      }
    }
  }

  for (const argument of node.arguments) {
    if (argument.type === 'ObjectExpression') {
      properties.push(...getObjectCSSProperties(context, argument));
    } else if (argument.type === 'Identifier' || argument.type === 'LogicalExpression') {
      // Handles this scenario:
      //
      //     const paddingStyles = css({ padding: '...' });
      //     const Component = styled.div(
      //         paddingStyles,
      //         { margin: '...' },
      //     )

      // For arguments of `styled` function calls, we can re-use some of the same
      // logic that we use to parse elements in the css prop array:
      //
      //            vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
      // <div css={[baseStyles, someCondition && someMoreStyles]}>Hello</div>
      properties.push(...parseCssArrayElement(context, argument));
    } else {
      // Handles the scenario where a `css` function call is inside a
      // `styled` function call:
      //
      //     styled.div(
      //         ({ disableClick }) => disableClick && css({ padding: '...' })
      //     )
      //
      // This MIGHT cause false positives, as all `css` function calls inside
      // `styled` function calls will be treated as applying to
      // the root component, but I don't know if it's possible for a nested
      // selector to be used in this scenario.
      //
      // Note that this does not cover the following scenario:
      //
      //     const paddingStyles = css({ padding: '...' });
      //     const Component = styled.div(
      //         ({ disableClick }) => disableClick && paddingStyles,
      //     )
      estraverse.traverse(argument, {
        enter(node) {
          const parseableTypes = [
            'Identifier',
            'LogicalExpression',
            'ConditionalExpression',
          ] as const;

          if (parseableTypes.includes(node.type as (typeof parseableTypes)[number])) {
            properties.push(
              ...parseCssArrayElement(
                context,
                node as Identifier | LogicalExpression | ConditionalExpression
              )
            );
          }
        },
      });
    }
  }

  return properties;
};

export const shorthandFirst: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Prevent unwanted side-effects by ensuring shorthand properties are always defined before their related longhands.',
      recommended: true,
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/shorthand-property-sorting',
    },
    messages: {
      'shorthand-first':
        'If the intention is to override a shorthand property with a longhand property, the longhand should come afterwards. Otherwise, it is redundant and may cause unwanted side effects with stylesheet extraction. Please remove the longhand if it is not your intention to override the shorthand.',
    },
    type: 'problem',
  },
  create(context) {
    return {
      // We use Rule.Node instead of JSXAttribute as the type, to avoid weird type errors with
      // the create(context) function.
      'JSXAttribute[name.name="css"], JSXAttribute[name.name="xcss"]': (node: Rule.Node) => {
        // Handle css, cssMap
        const properties: PropertyArray = [];

        if (node.type !== 'JSXAttribute' || node.value?.type !== 'JSXExpressionContainer') {
          return;
        }

        const expression = node.value.expression;
        if (expression.type === 'ArrayExpression') {
          for (const element of expression.elements) {
            properties.push(...parseCssArrayElement(context, element));
          }
        } else if (expression.type === 'CallExpression') {
          const { references } = context.sourceCode.getScope(expression);
          if (isCxFunction(expression.callee as Rule.Node, references)) {
            for (const argument of expression.arguments) {
              properties.push(...parseCssArrayElement(context, argument));
            }
          } else {
            properties.push(...parseCss(context, expression));
          }
        } else if (expression.type !== 'JSXEmptyExpression') {
          properties.push(...parseCssArrayElement(context, expression));
        }

        const { isValid, invalidProperties: _invalidProperties } = arePropertiesValid(properties);
        if (!isValid) {
          context.report({
            // TODO: maybe point to the specific Property node instead of the whole object?
            node,
            messageId: 'shorthand-first',
          });
        }
      },

      CallExpression: (node: CallExpression & NodeParentExtension) => {
        const properties = parseStyled(context, node);

        const { isValid, invalidProperties: _invalidProperties } = arePropertiesValid(properties);
        if (!isValid) {
          context.report({
            // TODO: maybe point to the specific Property node instead of the whole object?
            node,
            messageId: 'shorthand-first',
          });
        }
      },
    };
  },
};
