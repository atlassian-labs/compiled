import * as t from '@babel/types';

export const getJSXAttribute = (
  node: t.Node,
  name: string
): [t.JSXAttribute | undefined, number] => {
  if (!t.isJSXElement(node)) {
    return [undefined, -1];
  }

  // If there is dynamic CSS in use we have work to do.
  let i = -1;
  // Find the style prop on the opening JSX element.
  const jsxAttribute = node.openingElement.attributes.find(
    (attribute, index): attribute is t.JSXAttribute => {
      if (t.isJSXAttribute(attribute) && attribute.name.name === name) {
        i = index;
        return true;
      }

      return false;
    }
  );

  return [jsxAttribute, i];
};
