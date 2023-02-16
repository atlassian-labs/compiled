import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

import { ClassNameGenerator } from './utils/class-name-generator';

const UNDERSCORE_UNICODE = 95;

/**
 * Generate a compression map, which is used by @compiled/babel-plugin to compress class names.
 * The compression map looks like { 'aaaabbbb': 'a', 'bbbbcccc': 'b' }
 *
 * @param stylesheet css content i.e. `.aaaabbbb{font-size: 10px}`
 * @param oldClassNameCompressionMap the previous compression map, which ensures the compression is deterministic.
 * @returns newClassNameCompressionMap
 */
export const generateCompressionMap = (
  css: string,
  opts?: { oldClassNameCompressionMap?: { [index: string]: string }; prefix?: string }
): undefined | { [index: string]: string } => {
  const { oldClassNameCompressionMap, prefix } = opts || {};

  let classNamesToCompress: string[] = [];
  const classNameCompressionMap: { [index: string]: string } = {};
  const reservedClassNames: string[] = [];

  const selectorProcessor = selectorParser((selectors) => {
    selectors.walkClasses((node: selectorParser.ClassName | selectorParser.Identifier) => {
      // Only compress Atomic class names, which has the format of `_aaaabbbb`.
      if (node.value.charCodeAt(0) === UNDERSCORE_UNICODE && node.value.length === 9) {
        classNamesToCompress.push(node.value.slice(1));
      }
    });
  });

  const result = postcss([
    {
      postcssPlugin: 'postcss-find-atomic-class-names',
      Rule(ruleNode) {
        selectorProcessor.process(ruleNode);
      },
    },
  ]).process(css, { from: undefined });

  // We need to access something to make the transformation happen.
  result.css;

  // Remove duplicates
  classNamesToCompress = Array.from(new Set(classNamesToCompress));

  // Check if class name to compress already exists in oldClassNameCompressionMap
  // If yes, re-use the compressed class name
  if (oldClassNameCompressionMap) {
    classNamesToCompress = classNamesToCompress.filter((className) => {
      if (oldClassNameCompressionMap[className]) {
        reservedClassNames.push(oldClassNameCompressionMap[className]);
        classNameCompressionMap[className] = oldClassNameCompressionMap[className];
        return false;
      }
      return true;
    });
  }

  const classNameGenerator = new ClassNameGenerator({ reservedClassNames, prefix });
  classNamesToCompress.forEach((className) => {
    const newClassName = classNameGenerator.generateClassName();
    classNameCompressionMap[className] = newClassName;
  });

  return classNameCompressionMap;
};
