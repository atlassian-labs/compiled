import {
  shorthandBuckets,
  shorthandFor,
  kebabCase,
  type ShorthandProperties,
} from '@compiled/utils';
import type { Rule } from 'eslint';
import estraverse from 'estraverse';
import type {
  Node,
  ArrayExpression,
  CallExpression,
  ConditionalExpression,
  Identifier,
  LogicalExpression,
  ObjectExpression,
  Literal,
} from 'estree';

import { isCss, isCssMap, isCxFunction, isStyled } from '../../utils';

type NodeParentExtension = {
  parent: Rule.Node;
};

// node is used to determine what part of the code
// to which the ESLint violation should apply
type PropertyInfo = { name: string; node: Node };

// We use the PropertyArray type to represent all the properties that are applied to a component,
// thus giving us a way to check whether the properties are in order.
//
// Given a function call like this:
//
//     const Component = styled.div({
//         paddingTop: '...',
//         margin: '...',
//         padding: '...',
//         '&:hover': {
//             color: '...',
//             textAlign: '...',
//         },
//         color: '...',
//         border: '...',
//     });
//
// We can expect PropertyInfo to look something like this:
//
//     [
//         { name: 'paddingTop', node: Node },
//         { name: 'margin', node: Node },
//         { name: 'padding', node: Node },
//
//         // vvvvvv the below array represents a nested selector
//         [
//             { name: 'color', node: Node },
//             { name: 'textAlign', node: Node },
//         ],
//
//         { name: 'color', node: Node },
//         { name: 'border', node: Node },
//     ]
//
// Then, we would traverse through PropertyInfo and compare the property names.
// Whenever we encounter an array inside PropertyInfo (i.e. styles defined inside a nested
// selector), we traverse and check that separately.
type PropertyArray = (PropertyInfo | PropertyArray)[];

type PropertiesValid = {
  isValid: boolean;
  invalidProperties: [PropertyInfo, PropertyInfo][];
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
    functionCall.defs[0].node.init?.type === 'CallExpression'
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
      properties.push({ name: prop.key.name, node: prop.key });
    } else {
      // Property key is dynamic -- it may be a weird selector?
      // We can't parse this either way.
      continue;
    }
  }

  return properties;
};

// Given two (or more) arrays of properties, concatenate them in such a way that any
// repeated properties are de-duplicated.
//
// Nested arrays (nested selectors, pseudo-selectors, etc.) are not de-duplicated.
const union = (...otherArrays: PropertyArray[]): PropertyArray => {
  const newArray = [];
  const propertiesInArrayA = new Set<string>();

  if (otherArrays.length === 0) {
    return [];
  }

  const arrayA = otherArrays[0];

  for (const elementA of arrayA) {
    newArray.push(elementA);
    if (!Array.isArray(elementA)) {
      propertiesInArrayA.add(elementA.name);
    }
  }

  for (const arrayB of otherArrays.slice(1)) {
    for (const elementB of arrayB) {
      if (Array.isArray(elementB)) {
        newArray.push(elementB);
        continue;
      }

      if (propertiesInArrayA.has(elementB.name)) {
        continue;
      }

      newArray.push(elementB);
    }
  }

  return newArray;
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
    return union(
      parseCssArrayElement(context, element.consequent),
      parseCssArrayElement(context, element.alternate)
    );
  } else if (element.type === 'MemberExpression' && element.object.type === 'Identifier') {
    // Covers cssMap usages
    functionCall = getVariableDefinition(context, element.object);
    if (!functionCall) {
      return [];
    }
    if (element.property.type !== 'Identifier' && element.property.type !== 'Literal') {
      return [];
    }

    if (element.property.type === 'Identifier') {
      // Suppose we have a cssMap call that looks like
      //     const styles = cssMap({ ... });
      //
      // cssMapUsesStaticKey would be true for cases like
      //
      //    styles.hello
      //
      // but would be false for cases like
      //
      //    styles[hello]
      const cssMapUsesStaticKey = !element.computed;
      return parseCssMap(context, {
        node: functionCall,
        key: cssMapUsesStaticKey ? element.property.name : undefined,
      });
    } else if (element.property.type === 'Literal') {
      // This covers the case
      //     styles['hello']
      return parseCssMap(context, {
        node: functionCall,
        key: element.property.value,
      });
    }

    return [];
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
  let isValid: PropertiesValid['isValid'] = true;
  const invalidProperties: PropertiesValid['invalidProperties'] = [];

  for (let i = 0; i < properties.length; i++) {
    const propertiesI = properties[i];

    if (Array.isArray(propertiesI)) {
      const { isValid: nestedIsValid, invalidProperties: nestedInvalidProperties } =
        arePropertiesValid(propertiesI);
      isValid = isValid && nestedIsValid;
      invalidProperties.push(...nestedInvalidProperties);
    } else {
      const propertyA = kebabCase(propertiesI.name) as ShorthandProperties;
      const depthA = shorthandBuckets[propertyA] ?? Infinity;

      for (let j = i + 1; j < properties.length; j++) {
        const propertiesJ = properties[j];

        if (Array.isArray(propertiesJ)) {
          continue;
        }

        if (propertiesI.name === propertiesJ.name) {
          continue;
        }

        const propertyB = kebabCase(propertiesJ.name) as ShorthandProperties;
        const depthB = shorthandBuckets[propertyB] ?? Infinity;

        if (depthA >= depthB && shorthandFor[propertyB] === true) {
          // propertyB === 'all', which is a property that should come before every other property.
          isValid = false;
          invalidProperties.push([propertiesI, propertiesJ]);
          break;
        }

        const longhandsForPropA: string[] = [
          propertyA,
          ...(Array.isArray(shorthandFor[propertyA]) ? (shorthandFor[propertyA] as string[]) : []),
        ];
        const longhandsForPropB: string[] = [
          propertyB,
          ...(Array.isArray(shorthandFor[propertyB]) ? (shorthandFor[propertyB] as string[]) : []),
        ];

        if (Array.isArray(longhandsForPropA) && Array.isArray(longhandsForPropB)) {
          // find intersection between objects
          const intersectionAB = longhandsForPropA.filter((x) => longhandsForPropB.includes(x));

          if (intersectionAB.length > 0 && depthA >= depthB) {
            isValid = false;
            invalidProperties.push([propertiesI, propertiesJ]);
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

const parseCssMap = (
  context: Rule.RuleContext,
  { node, key }: { node: CallExpression; key?: string | Literal['value'] }
): PropertyArray => {
  const properties: PropertyArray[] = [];
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

    if (key) {
      // If we know what key in the cssMap function call to traverse,
      // we can make sure we only traverse that.
      if (property.key.type === 'Literal' && key === property.key.value) {
        return getObjectCSSProperties(context, property.value);
      } else if (property.key.type === 'Identifier' && key === property.key.name) {
        return getObjectCSSProperties(context, property.value);
      }
    }

    // We cannot determine which key in the cssMap function call to traverse,
    // so we have no choice but to unconditionally traverse through the whole
    // cssMap object.
    //
    // Not very performant and can give false positives, but considering that
    // the cssMap key can be dynamic, we at least avoid any false negatives.
    //
    // (https://compiledcssinjs.com/docs/api-cssmap#dynamic-declarations)
    properties.push(getObjectCSSProperties(context, property.value));
  }

  return union(...properties);
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

const reportProblem = (
  context: Rule.RuleContext,
  invalidProperties: PropertiesValid['invalidProperties']
) => {
  for (const [propertyA, propertyB] of invalidProperties) {
    context.report({
      node: propertyA.node,
      messageId: 'shorthand-first',
      data: {
        propertyA: propertyA.name,
        propertyB: propertyB.name,
      },
    });
    context.report({
      node: propertyB.node,
      messageId: 'shorthand-first',
      data: {
        propertyA: propertyA.name,
        propertyB: propertyB.name,
      },
    });
  }
};

export const shorthandFirst: Rule.RuleModule = {
  meta: {
    docs: {
      description:
        'Prevent unwanted side-effects by ensuring shorthand properties are always defined before their corresponding longhand properties.',
      recommended: true,
      url: 'https://github.com/atlassian-labs/compiled/tree/master/packages/eslint-plugin/src/rules/shorthand-property-sorting',
    },
    messages: {
      'shorthand-first':
        'CSS shorthand properties should come before its corresponding non-shorthand property equivalents, or else your source code will not match runtime behavior.\n\n' +
        "Here, '{{propertyB}}' should come before '{{propertyA}}'.\n\n" +
        "Please expand the shorthand property '{{propertyB}}' so that it matches '{{propertyA}}'. For example, 'padding' can be expanded to paddingTop, paddingBottom, paddingLeft, and paddingRight. If this is not possible, please change the order so that the shorthand property comes before the non-shorthand property.",
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

        const { isValid, invalidProperties: invalidProperties } = arePropertiesValid(properties);
        if (!isValid) {
          reportProblem(context, invalidProperties);
        }
      },

      CallExpression: (node: CallExpression & NodeParentExtension) => {
        const properties = parseStyled(context, node);

        const { isValid, invalidProperties } = arePropertiesValid(properties);
        if (!isValid) {
          reportProblem(context, invalidProperties);
        }
      },
    };
  },
};
